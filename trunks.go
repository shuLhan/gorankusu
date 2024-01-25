// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"

	liberrors "github.com/shuLhan/share/lib/errors"
	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/mlog"
)

// Version of trunks module.
const Version = `0.4.1`

// List of default values.
const (
	DefaultAttackDuration      = 10 * time.Second
	DefaultAttackRatePerSecond = 500
	DefaultAttackTimeout       = 30 * time.Second
	DefaultMaxAttackDuration   = 30 * time.Second
	DefaultMaxAttackRate       = 3000

	DefaultListenAddress = `127.0.0.1:8217`
)

// EnvDevelopment setting this environment variable will enable trunks
// development mode.
const EnvDevelopment = "TRUNKS_DEV"

// List of HTTP parameters.
const (
	paramNameName = "name"
)

// Trunks is the HTTP server with web user interface and APIs for running and
// load testing the registered HTTP endpoints.
type Trunks struct {
	Env   *Environment
	Httpd *libhttp.Server

	attackq chan *RunRequest
	cancelq chan bool
	errq    chan error

	targets  []*Target
	navLinks []*NavLink
}

// New create and initialize new Trunks service.
func New(env *Environment) (trunks *Trunks, err error) {
	var (
		logp          = "trunks.New"
		isDevelopment = len(os.Getenv(EnvDevelopment)) > 0
	)

	err = env.init()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	trunks = &Trunks{
		Env:     env,
		attackq: make(chan *RunRequest, 1),
		cancelq: make(chan bool, 1),
		errq:    make(chan error, 1),
	}

	err = trunks.initHTTPServer(isDevelopment)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	return trunks, nil
}

// AttackHTTP start attacking the HTTP target defined in req.
func (trunks *Trunks) AttackHTTP(req *RunRequest) (err error) {
	var logp = `AttackHTTP`

	if trunks.Env.isAttackRunning() {
		return errAttackConflict(trunks.Env.getRunningAttack())
	}

	var origTarget = trunks.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return errInvalidTarget(req.Target.ID)
	}

	var origHTTPTarget = origTarget.getHTTPTarget(req.HTTPTarget.ID)
	if origTarget == nil {
		return errInvalidHTTPTarget(req.HTTPTarget.ID)
	}
	if !origHTTPTarget.AllowAttack {
		return errAttackNotAllowed()
	}
	if origHTTPTarget.Attack == nil {
		return fmt.Errorf(`%s: %w`, logp, &errAttackHandlerNotSet)
	}

	req = generateRunRequest(trunks.Env, req, origTarget, origHTTPTarget)

	req.result, err = newAttackResult(trunks.Env, req)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	trunks.attackq <- req

	msg := fmt.Sprintf("Attacking %s%s with %d RPS for %s seconds",
		req.Target.BaseURL, req.HTTPTarget.Path,
		req.Target.Opts.RatePerSecond, req.Target.Opts.Duration)

	mlog.Outf(`%s: %s`, logp, msg)

	return nil
}

// AttackHTTPCancel cancel any running attack.
// It will return an error if no attack is running.
func (trunks *Trunks) AttackHTTPCancel() (rr *RunRequest, err error) {
	rr = trunks.Env.getRunningAttack()
	if rr == nil {
		e := &liberrors.E{
			Code:    http.StatusNotFound,
			Message: "No attack is currently running.",
			Name:    "ERR_ATTACK_CANCEL_NOT_FOUND",
		}
		return nil, e
	}

	trunks.cancelq <- true

	return rr, nil
}

// RegisterNavLink register custom navigation link.
func (trunks *Trunks) RegisterNavLink(nav *NavLink) (err error) {
	if nav == nil {
		return
	}

	err = nav.init()
	if err != nil {
		return fmt.Errorf("RegisterNavLink: %w", err)
	}

	trunks.navLinks = append(trunks.navLinks, nav)

	return nil
}

// RegisterTarget register Target to be attached to Trunks.
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

// RunHTTP send the HTTP request to the HTTP target defined in RunRequest with
// optional Headers and Parameters.
func (trunks *Trunks) RunHTTP(req *RunRequest) (res *RunResponse, err error) {
	var origTarget = trunks.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	var origHTTPTarget = origTarget.getHTTPTarget(req.HTTPTarget.ID)
	if origHTTPTarget == nil {
		return nil, errInvalidHTTPTarget(req.HTTPTarget.ID)
	}

	if origHTTPTarget.Run == nil {
		req.Target.BaseURL = origTarget.BaseURL
		req.Target.Name = origTarget.Name
		req.HTTPTarget.ConvertParams = origHTTPTarget.ConvertParams
		res, err = trunks.runHTTPTarget(req)
	} else {
		req = generateRunRequest(trunks.Env, req, origTarget, origHTTPTarget)
		res, err = req.HTTPTarget.Run(req)
	}
	if err != nil {
		return nil, err
	}
	return res, nil
}

// Start the Trunks HTTP server that provide user interface for running and
// load testing registered Targets.
func (trunks *Trunks) Start() (err error) {
	mlog.Outf(`trunks: scanning previous attack results...`)

	trunks.scanResultsDir()

	mlog.Outf(`trunks: starting attack worker...`)
	go trunks.workerAttackQueue()

	mlog.Outf(`trunks: starting HTTP server at http://%s`, trunks.Env.ListenAddress)
	go func() {
		var errStart = trunks.Httpd.Start()
		if errStart != nil {
			trunks.errq <- errStart
		}
	}()

	err = <-trunks.errq

	return err
}

// Stop the Trunks HTTP server.
func (trunks *Trunks) Stop() {
	logp := "trunks.Stop"
	mlog.Outf(`=== Stopping the Trunks service ...`)

	err := trunks.Httpd.Stop(0)
	if err != nil {
		mlog.Errf(`!!! %s: %s`, logp, err)
	}

	if trunks.isLoadTesting() {
		trunks.cancelq <- true
		<-trunks.cancelq
	}

	trunks.errq <- nil
}

func (trunks *Trunks) addHTTPAttackResult(rr *RunRequest) (ok bool) {
	var (
		target     *Target
		httpTarget *HTTPTarget
	)
	for _, target = range trunks.targets {
		if target.ID != rr.Target.ID {
			continue
		}
		for _, httpTarget = range target.HTTPTargets {
			if httpTarget.ID != rr.HTTPTarget.ID {
				continue
			}

			httpTarget.Results = append(httpTarget.Results, rr.result)
			httpTarget.sortResults()
			return true
		}
	}
	return false
}

func (trunks *Trunks) isLoadTesting() (b bool) {
	trunks.Env.mtx.Lock()
	if trunks.Env.AttackRunning != nil {
		b = true
	}
	trunks.Env.mtx.Unlock()
	return b
}

func (trunks *Trunks) getTargetByID(id string) *Target {
	for _, target := range trunks.targets {
		if target.ID == id {
			return target
		}
	}
	return nil
}

func (trunks *Trunks) getAttackResultByName(name string) (t *Target, ht *HTTPTarget, result *AttackResult, err error) {
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
		res.Message = `HTTPTarget ID not found`
		return nil, nil, nil, res
	}

	result = ht.getResultByName(name)
	if result == nil {
		res.Message = "Result file not found"
		return nil, nil, nil, res
	}

	return t, ht, result, nil
}

func (trunks *Trunks) getTargetByResultFilename(name string) (t *Target, ht *HTTPTarget) {
	names := strings.Split(name, ".")

	t = trunks.getTargetByID(names[0])
	if t == nil {
		return t, nil
	}

	if len(names) > 0 {
		ht = t.getHTTPTarget(names[1])
	}

	return t, ht
}

// runHTTPTarget default [HTTPTarget.Run] handler that generate HTTP request
// and send it to the target.
func (trunks *Trunks) runHTTPTarget(rr *RunRequest) (res *RunResponse, err error) {
	var (
		logp    = `runHTTPTarget`
		headers = rr.HTTPTarget.Headers.ToHTTPHeader()
		params  interface{}
	)

	httpcOpts := &libhttp.ClientOptions{
		ServerUrl:     rr.Target.BaseURL,
		AllowInsecure: true,
	}

	httpc := libhttp.NewClient(httpcOpts)

	rr.HTTPTarget.paramsToPath()

	if rr.HTTPTarget.ConvertParams == nil {
		switch rr.HTTPTarget.RequestType {
		case libhttp.RequestTypeJSON:
			params = rr.HTTPTarget.Params.ToJSONObject()
		case libhttp.RequestTypeMultipartForm:
			params = rr.HTTPTarget.Params.ToMultipartFormData()
		default:
			params = rr.HTTPTarget.Params.ToURLValues()
		}
	} else {
		params, err = rr.HTTPTarget.ConvertParams(&rr.HTTPTarget)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}
	}

	res = &RunResponse{}

	httpRequest, err := httpc.GenerateHttpRequest(
		rr.HTTPTarget.Method,
		rr.HTTPTarget.Path,
		rr.HTTPTarget.RequestType,
		headers,
		params,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = res.SetHTTPRequest(httpRequest)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	httpResponse, _, err := httpc.Do(httpRequest)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	err = res.SetHTTPResponse(httpResponse)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	return res, nil
}

// scanResultsDir scan the environment's ResultsDir for the past attack
// results and add it to each target based on ID on file name.
//
// Due to size of file can be big (maybe more than 5000 records), this
// function only parse the file name and append it to Results field.
func (trunks *Trunks) scanResultsDir() {
	logp := "scanResultsDir"

	dir, err := os.Open(trunks.Env.ResultsDir)
	if err != nil {
		mlog.Errf(`%s: %s`, logp, err)
		return
	}

	fis, err := dir.Readdir(0)
	if err != nil {
		mlog.Errf(`%s: %s`, logp, err)
		return
	}

	mlog.Outf(`--- %s: loading %d files from past results ...`, logp, len(fis))

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
			mlog.Outf(`--- %s %d/%d: Target ID not found for %q`, logp, x+1, len(fis), name)
			continue
		}
		if ht == nil {
			mlog.Outf(`--- %s %d/%d: HTTPTarget ID not found for %q`, logp, x+1, len(fis), name)
			continue
		}

		mlog.Outf(`--- %s %d/%d: loading %q with size %d Kb`, logp, x+1, len(fis), name, fi.Size()/1024)

		ht.addResult(trunks.Env.ResultsDir, name)
	}

	mlog.Outf(`--- %s: all pass results has been loaded ...`, logp)

	var (
		target     *Target
		httpTarget *HTTPTarget
	)
	for _, target = range trunks.targets {
		for _, httpTarget = range target.HTTPTargets {
			httpTarget.sortResults()
		}
	}
}

func (trunks *Trunks) workerAttackQueue() {
	logp := "workerAttackQueue"

	for rr := range trunks.attackq {
		var err error
		trunks.Env.AttackRunning = rr

		if rr.HTTPTarget.PreAttack != nil {
			rr.HTTPTarget.PreAttack(rr)
		}

		isCancelled := false
		attacker := vegeta.NewAttacker(
			vegeta.Timeout(rr.Target.Opts.Timeout),
		)

		for res := range attacker.Attack(
			rr.HTTPTarget.Attack(rr),
			rr.Target.Opts.ratePerSecond,
			rr.Target.Opts.Duration,
			rr.HTTPTarget.ID,
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
				mlog.Errf(`%s: %s fail: %s.`, logp, rr.result.Name, err)
			} else {
				mlog.Outf(`%s: %s canceled.`, logp, rr.result.Name)
				// Inform the caller that the attack has been canceled.
				trunks.cancelq <- true
			}
		} else {
			err = rr.result.finish()
			if err != nil {
				mlog.Errf(`%s %s: %s`, logp, rr.result.Name, err)
			}

			trunks.addHTTPAttackResult(rr)

			mlog.Outf(`%s: %s finished.`, logp, rr.result.Name)
		}

		rr.result = nil
		trunks.Env.AttackRunning = nil
	}
}
