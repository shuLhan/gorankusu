// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"

	"github.com/shuLhan/share/lib/debug"
	liberrors "github.com/shuLhan/share/lib/errors"
	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
)

const (
	DefaultAttackDuration      = 10 * time.Second
	DefaultAttackRatePerSecond = 500
	DefaultAttackTimeout       = 30 * time.Second
	DefaultListenAddress       = "127.0.0.1:8217"
	DefaultMaxAttackDuration   = 30 * time.Second
	DefaultMaxAttackRate       = 3000
)

// List of HTTP APIs provided by Trunks HTTP server.
const (
	apiEnvironment        = "/_trunks/api/environment"
	apiTargetAttack       = "/_trunks/api/target/attack"
	apiTargetAttackResult = "/_trunks/api/target/attack/result"
	apiTargetRunHttp      = "/_trunks/api/target/run/http"
	apiTargetRunWebSocket = "/_trunks/api/target/run/websocket"
	apiTargets            = "/_trunks/api/targets"
)

// List of HTTP parameters.
const (
	paramNameName = "name"
)

//
// Trunks is the HTTP server with web user interface and APIs for running and
// load testing the registered HTTP endpoints.
//
type Trunks struct {
	*libhttp.Server

	Env     *Environment
	targets []*Target

	attackq chan *RunRequest
	cancelq chan bool
}

//
// New create and initialize new Trunks service.
//
func New(env *Environment) (trunks *Trunks, err error) {
	err = env.init()
	if err != nil {
		return nil, fmt.Errorf("New: %w", err)
	}

	trunks = &Trunks{
		Env:     env,
		attackq: make(chan *RunRequest, 1),
		cancelq: make(chan bool, 1),
	}

	httpdOpts := &libhttp.ServerOptions{
		Options: memfs.Options{
			Root:        "_www",
			Development: debug.Value >= 2,
		},
		Memfs:   memfsWWW,
		Address: env.ListenAddress,
	}

	trunks.Server, err = libhttp.NewServer(httpdOpts)
	if err != nil {
		return nil, fmt.Errorf("New: %w", err)
	}

	err = trunks.registerHttpApis()
	if err != nil {
		return nil, fmt.Errorf("New: %w", err)
	}

	return trunks, nil
}

func (trunks *Trunks) RegisterTarget(target *Target) (err error) {
	if target == nil {
		return
	}

	err = target.init()
	if err != nil {
		return fmt.Errorf("RegisterTarget: %w", err)
	}

	trunks.targets = append(trunks.targets, target)

	return nil
}

//
// Start the Trunks HTTP server that provide user interface for running and
// load testing registered Targets.
//
func (trunks *Trunks) Start() (err error) {
	mlog.Outf("trunks: scanning previous attack results...\n")
	trunks.scanResultsDir()

	mlog.Outf("trunks: starting attack worker...\n")
	go trunks.workerAttackQueue()

	mlog.Outf("trunks: starting HTTP server at %s\n", trunks.Env.ListenAddress)
	return trunks.Server.Start()
}

//
// Stop the Trunks HTTP server.
//
func (trunks *Trunks) Stop() {
	mlog.Outf("=== Stopping the Trunks service ...\n")

	err := trunks.Server.Stop(0)
	if err != nil {
		mlog.Errf("!!! Stop: %s\n", err)
	}

	if trunks.isLoadTesting() {
		trunks.cancelq <- true
		<-trunks.cancelq
	}
}

func (trunks *Trunks) isLoadTesting() (b bool) {
	trunks.Env.mtx.Lock()
	if trunks.Env.AttackRunning != nil {
		b = true
	}
	trunks.Env.mtx.Unlock()
	return b
}

//
// registerHttpApis register HTTP APIs to communicate with the Trunks server.
//
func (trunks *Trunks) registerHttpApis() (err error) {
	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         apiEnvironment,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiEnvironmentGet,
	})
	if err != nil {
		return err
	}

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         apiTargetAttack,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetAttack,
	})
	if err != nil {
		return err
	}
	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         apiTargetAttack,
		RequestType:  libhttp.RequestTypeNone,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetAttackCancel,
	})
	if err != nil {
		return err
	}

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         apiTargetAttackResult,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetAttackResultGet,
	})
	if err != nil {
		return err
	}
	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         apiTargetAttackResult,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetAttackResultDelete,
	})
	if err != nil {
		return err
	}

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         apiTargetRunHttp,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetRunHttp,
	})
	if err != nil {
		return err
	}

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         apiTargetRunWebSocket,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetRunWebSocket,
	})
	if err != nil {
		return err
	}

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         apiTargets,
		RequestType:  libhttp.RequestTypeNone,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargets,
	})
	if err != nil {
		return err
	}

	return nil
}

//
// apiEnvironmentGet get the Trunks environment including its state.
//
func (trunks *Trunks) apiEnvironmentGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.Env
	return json.Marshal(&res)
}

//
// apiTargetAttack run the load testing on HTTP endpoint with target and
// options defined in request.
//
func (trunks *Trunks) apiTargetAttack(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	if trunks.Env.isAttackRunning() {
		return nil, errAttackConflict(trunks.Env.getRunningAttack())
	}

	logp := "apiTargetAttack"
	req := &RunRequest{}

	err = json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}
	if req.Target == nil {
		return nil, errInvalidTarget("")
	}

	origTarget := trunks.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	origHttpTarget := origTarget.getHttpTargetByID(req.HttpTarget.ID)
	if origTarget == nil {
		return nil, errInvalidHttpTarget(req.HttpTarget.ID)
	}

	if !origHttpTarget.AllowAttack {
		return nil, errAttackNotAllowed()
	}

	req.mergeHttpTarget(trunks.Env, origTarget, origHttpTarget)

	req.result, err = newAttackResult(trunks.Env, req)
	if err != nil {
		return nil, err
	}

	trunks.attackq <- req

	msg := fmt.Sprintf("Attacking %s/%s with %d RPS for %s seconds",
		req.Target.BaseUrl, req.HttpTarget.Path,
		req.Target.Opts.RatePerSecond, req.Target.Opts.Duration)

	mlog.Outf("%s: %s\n", logp, msg)

	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Name = "OK_ATTACK"
	res.Message = msg

	return json.Marshal(res)
}

func (trunks *Trunks) apiTargetAttackCancel(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := &libhttp.EndpointResponse{}

	rr := trunks.Env.getRunningAttack()
	if rr == nil {
		res.Code = http.StatusNotFound
		res.Message = "No attack is currently running."
		res.Name = "ERR_ATTACK_CANCEL_NOT_FOUND"
		return nil, res
	}

	trunks.cancelq <- true

	res.Code = http.StatusOK
	res.Name = "OK_ATTACK_CANCEL"
	res.Message = fmt.Sprintf(`Attack on target "%s / %s" has been canceled`,
		rr.Target.Name, rr.HttpTarget.Name)
	res.Data = rr

	return json.Marshal(res)
}

func (trunks *Trunks) apiTargetAttackResultGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	name := epr.HttpRequest.Form.Get(paramNameName)
	if len(name) == 0 {
		return nil, errInvalidParameter(paramNameName, name)
	}

	_, _, result, err := trunks.getAttackResultByName(name)
	if err != nil {
		return nil, err
	}

	err = result.load()
	if err != nil {
		return nil, err
	}

	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Name = "OK_TARGET_ATTACK_RESULT_GET"
	res.Data = result

	return json.Marshal(&res)
}

func (trunks *Trunks) apiTargetAttackResultDelete(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	name := epr.HttpRequest.Form.Get(paramNameName)
	if len(name) == 0 {
		return nil, errInvalidParameter(paramNameName, name)
	}

	_, ht, result, err := trunks.getAttackResultByName(name)
	if err != nil {
		return nil, err
	}

	ht.deleteResult(result)

	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Name = "OK_TARGET_ATTACK_RESULT_GET"
	res.Data = result

	return json.Marshal(&res)
}

func (trunks *Trunks) apiTargetRunHttp(epr *libhttp.EndpointRequest) ([]byte, error) {
	req := &RunRequest{}
	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}
	if req.Target == nil {
		return nil, errInvalidTarget("")
	}

	origTarget := trunks.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	if req.HttpTarget == nil {
		return nil, errInvalidHttpTarget("")
	}

	origHttpTarget := origTarget.getHttpTargetByID(req.HttpTarget.ID)
	if origHttpTarget == nil {
		return nil, errInvalidHttpTarget(req.HttpTarget.ID)
	}

	var res *RunResponse

	if req.HttpTarget.Run == nil {
		req.Target.BaseUrl = origTarget.BaseUrl
		req.Target.Name = origTarget.Name
		res, err = trunks.runHttpTarget(req)
	} else {
		req.mergeHttpTarget(trunks.Env, origTarget, origHttpTarget)
		res, err = req.HttpTarget.Run(req)
	}
	if err != nil {
		return nil, errInternal(err)
	}

	epres := libhttp.EndpointResponse{}
	epres.Code = http.StatusOK
	epres.Data = res

	return json.Marshal(&epres)
}

func (trunks *Trunks) apiTargetRunWebSocket(epr *libhttp.EndpointRequest) ([]byte, error) {
	req := &RunRequest{}
	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}
	if req.Target == nil {
		return nil, errInvalidTarget("")
	}

	origTarget := trunks.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	if req.WebSocketTarget == nil {
		return nil, errInvalidWebSocketTarget("")
	}

	origWsTarget := origTarget.getWebSocketTargetByID(req.WebSocketTarget.ID)
	if origWsTarget == nil {
		return nil, errInvalidWebSocketTarget(req.WebSocketTarget.ID)
	}

	req.mergeWebSocketTarget(trunks.Env, origTarget, origWsTarget)

	return req.WebSocketTarget.Run(req)
}

func (trunks *Trunks) apiTargets(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.targets
	return json.Marshal(&res)
}

func (trunks *Trunks) getTargetByID(id string) *Target {
	for _, target := range trunks.targets {
		if target.ID == id {
			return target
		}
	}
	return nil
}

func (trunks *Trunks) getAttackResultByName(name string) (t *Target, ht *HttpTarget, result *AttackResult, err error) {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code: http.StatusNotFound,
			Name: "ERR_ATTACK_RESULT_NOT_FOUND",
		},
	}

	t, ht = trunks.getTargetByResultFilename(name)
	if t == nil {
		res.Message = "Target ID not found"
		return nil, nil, nil, res
	}
	if ht == nil {
		res.Message = "HttpTarget ID not found"
		return nil, nil, nil, res
	}

	result = ht.getResultByName(name)
	if result == nil {
		res.Message = "Result file not found"
		return nil, nil, nil, res
	}

	return t, ht, result, nil
}

func (trunks *Trunks) getTargetByResultFilename(name string) (t *Target, ht *HttpTarget) {
	names := strings.Split(name, ".")

	t = trunks.getTargetByID(names[0])
	if t == nil {
		return t, nil
	}

	if len(names) > 0 {
		ht = t.getHttpTargetByID(names[1])
	}

	return t, ht
}

func (trunks *Trunks) runHttpTarget(rr *RunRequest) (res *RunResponse, err error) {
	var (
		logp    = "runHttpTarget"
		httpc   = libhttp.NewClient(rr.Target.BaseUrl, nil, true)
		headers = rr.HttpTarget.Headers.ToHttpHeader()
		params  interface{}
	)

	if rr.HttpTarget.RequestType == libhttp.RequestTypeJSON {
		params = rr.HttpTarget.Params
	} else {
		params = rr.HttpTarget.Params.ToUrlValues()
	}

	res = &RunResponse{}

	httpRequest, err := httpc.GenerateHttpRequest(
		rr.HttpTarget.Method,
		rr.HttpTarget.Path,
		rr.HttpTarget.RequestType,
		headers,
		params,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = res.SetHttpRequest(httpRequest)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	httpResponse, _, err := httpc.Do(httpRequest)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = res.SetHttpResponse(httpResponse)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	return res, nil
}

//
// scanResultsDir scan the environment's ResultsDir for the past attack
// results and add it to each target based on ID on file name.
//
// Due to size of file can be big (maybe more than 5000 records), this
// function only parse the file name and append it to Results field.
//
func (trunks *Trunks) scanResultsDir() {
	logp := "scanResultsDir"

	dir, err := os.Open(trunks.Env.ResultsDir)
	if err != nil {
		mlog.Errf("%s: %s\n", logp, err)
		return
	}

	fis, err := dir.Readdir(0)
	if err != nil {
		mlog.Errf("%s: %s\n", logp, err)
		return
	}

	mlog.Outf("--- %s: loading %d files from past results ...\n", logp, len(fis))

	for x, fi := range fis {
		name := fi.Name()
		if name == "lost+found" {
			continue
		}
		if name[0] == '.' {
			continue
		}

		t, ht := trunks.getTargetByResultFilename(name)
		if t == nil {
			mlog.Outf("--- %s %d/%d: Target ID not found for %q\n", logp, x+1, len(fis), name)
			continue
		}
		if ht == nil {
			mlog.Outf("--- %s %d/%d: HttpTarget ID not found for %q\n", logp, x+1, len(fis), name)
			continue
		}

		mlog.Outf("--- %s %d/%d: loading %q with size %d Kb\n", logp, x+1, len(fis), name, fi.Size()/1024)

		ht.addResult(trunks.Env.ResultsDir, name)
	}

	mlog.Outf("--- %s: all pass results has been loaded ...\n", logp)

	for _, target := range trunks.targets {
		for _, httpTarget := range target.HttpTargets {
			sort.Slice(httpTarget.Results, func(x, y int) bool {
				return httpTarget.Results[x].Name > httpTarget.Results[y].Name
			})
		}
	}
}

func (trunks *Trunks) workerAttackQueue() {
	logp := "workerAttackQueue"

	for rr := range trunks.attackq {
		var err error
		trunks.Env.AttackRunning = rr

		if rr.HttpTarget.PreAttack != nil {
			rr.HttpTarget.PreAttack(rr)
		}

		isCancelled := false
		attacker := vegeta.NewAttacker(
			vegeta.Timeout(rr.Target.Opts.Timeout),
		)

		for res := range attacker.Attack(
			rr.HttpTarget.Attack(rr),
			rr.Target.Opts.ratePerSecond,
			rr.Target.Opts.Duration,
			rr.HttpTarget.ID,
		) {
			err = rr.result.add(res)
			if err != nil {
				break
			}

			select {
			case <-trunks.cancelq:
				isCancelled = true
			default:
			}
			if isCancelled {
				break
			}
		}

		if err != nil || isCancelled {
			attacker.Stop()
			rr.result.cancel()

			if err != nil {
				mlog.Errf("%s: %s fail: %s.\n", logp, rr.result.Name, err)
			} else {
				mlog.Outf("%s: %s canceled.\n", logp, rr.result.Name)
				// Inform the caller that the attack has been canceled.
				trunks.cancelq <- true
			}
		} else {
			err = rr.result.finish()
			if err != nil {
				mlog.Errf("%s %s: %s\n", logp, rr.result.Name, err)
			}

			rr.HttpTarget.Results = append(rr.HttpTarget.Results, rr.result)

			sort.Slice(rr.HttpTarget.Results, func(x, y int) bool {
				return rr.HttpTarget.Results[x].Name > rr.HttpTarget.Results[y].Name
			})

			mlog.Outf("%s: %s finished.\n", logp, rr.result.Name)
		}

		rr.result = nil
		trunks.Env.AttackRunning = nil
	}
}
