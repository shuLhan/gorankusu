// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"

	"github.com/shuLhan/share/lib/debug"
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
	apiEnvironment         = "/_trunks/api/environment"
	apiTargetAttack        = "/_trunks/api/target/attack"
	apiTargetAttackResults = "/_trunks/api/target/attack/results"
	apiTargetRun           = "/_trunks/api/target/run"
	apiTargets             = "/_trunks/api/targets"
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
	mlog.Outf("Starting attack worker...\n")
	go trunks.workerAttackQueue()

	mlog.Outf("starting HTTP server at %s\n", trunks.Env.ListenAddress)
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

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         apiTargetAttackResults,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetAttackResultsGet,
	})
	if err != nil {
		return err
	}
	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         apiTargetAttackResults,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetAttackResultsDelete,
	})
	if err != nil {
		return err
	}

	err = trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         apiTargetRun,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         trunks.apiTargetRun,
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

	req.merge(trunks.Env, origTarget, origHttpTarget)

	req.result, err = newAttackResult(trunks.Env, req)
	if err != nil {
		return nil, err
	}

	trunks.attackq <- req

	msg := fmt.Sprintf("attacking %s/%s with %d RPS for %d seconds",
		req.Target.Opts.BaseUrl, req.HttpTarget.Path,
		req.Target.Opts.RatePerSecond, req.Target.Opts.Duration)

	mlog.Outf("%s: %s\n", logp, msg)

	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Message = msg

	return json.Marshal(res)
}

func (trunks *Trunks) apiTargetAttackCancel(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	return resbody, nil
}

func (trunks *Trunks) apiTargetAttackResultsGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	return resbody, nil
}

func (trunks *Trunks) apiTargetAttackResultsDelete(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	return resbody, nil
}

func (trunks *Trunks) apiTargetRun(epr *libhttp.EndpointRequest) ([]byte, error) {
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

	if req.HttpTarget != nil {
		origHttpTarget := origTarget.getHttpTargetByID(req.HttpTarget.ID)
		if origHttpTarget == nil {
			return nil, errInvalidHttpTarget(req.HttpTarget.ID)
		}

		req.merge(trunks.Env, origTarget, origHttpTarget)

		return req.HttpTarget.Run(req)
	}

	return nil, errInvalidHttpTarget("")
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

func (trunks *Trunks) workerAttackQueue() (err error) {
	logp := "workerAttackQueue"

	for rr := range trunks.attackq {
		rr.HttpTarget.PreAttack(rr)

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

			return nil
		}

		err := rr.result.finish()
		if err != nil {
			mlog.Errf("%s %s: %s\n", logp, rr.result.Name, err)
		}

		rr.HttpTarget.Results = append(rr.HttpTarget.Results, rr.result)

		sort.Slice(rr.HttpTarget.Results, func(x, y int) bool {
			return rr.HttpTarget.Results[x].Name > rr.HttpTarget.Results[y].Name
		})

		mlog.Outf("%s: %s finished.\n", logp, rr.result.Name)
	}
	return nil
}
