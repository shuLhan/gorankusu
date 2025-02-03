// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	vegeta "github.com/tsenart/vegeta/v12/lib"

	liberrors "git.sr.ht/~shulhan/pakakeh.go/lib/errors"
	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
	"git.sr.ht/~shulhan/pakakeh.go/lib/mlog"
)

// Version of gorankusu module.
const Version = `0.8.0`

// Gorankusu is the HTTP server with web user interface and APIs for running and
// load testing the registered HTTP endpoints.
type Gorankusu struct {
	Env   *Environment
	Httpd *libhttp.Server

	attackq chan *RunRequest
	cancelq chan bool
	errq    chan error

	targets  []*Target
	navLinks []*NavLink
}

// New create and initialize new Gorankusu service.
func New(env *Environment) (gorankusu *Gorankusu, err error) {
	var logp = `New`

	err = env.init()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	gorankusu = &Gorankusu{
		Env:      env,
		attackq:  make(chan *RunRequest, 1),
		cancelq:  make(chan bool, 1),
		errq:     make(chan error, 1),
		navLinks: make([]*NavLink, 0, 1),
	}

	err = gorankusu.initHTTPServer(env.IsDevelopment)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	return gorankusu, nil
}

// AttackHTTP start attacking the HTTP target defined in req.
func (gorankusu *Gorankusu) AttackHTTP(req *RunRequest) (err error) {
	var logp = `AttackHTTP`

	if gorankusu.Env.isAttackRunning() {
		return errAttackConflict(gorankusu.Env.getRunningAttack())
	}

	var origTarget = gorankusu.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return errInvalidTarget(req.Target.ID)
	}

	var origHTTPTarget = origTarget.getHTTPTarget(req.HTTPTarget.ID)
	if origHTTPTarget == nil {
		return errInvalidHTTPTarget(req.HTTPTarget.ID)
	}
	if !origHTTPTarget.AllowAttack {
		return errAttackNotAllowed()
	}

	req = generateRunRequest(gorankusu.Env, req, origTarget, origHTTPTarget)

	req.result, err = newAttackResult(gorankusu.Env, req)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	gorankusu.attackq <- req

	msg := fmt.Sprintf("Attacking %s%s with %d RPS for %s seconds",
		req.Target.BaseURL, req.HTTPTarget.Path,
		req.Target.Opts.RatePerSecond, req.Target.Opts.Duration)

	mlog.Outf(`%s: %s`, logp, msg)

	return nil
}

// AttackHTTPCancel cancel any running attack.
// It will return an error if no attack is running.
func (gorankusu *Gorankusu) AttackHTTPCancel() (rr *RunRequest, err error) {
	rr = gorankusu.Env.getRunningAttack()
	if rr == nil {
		e := &liberrors.E{
			Code:    http.StatusNotFound,
			Message: "No attack is currently running.",
			Name:    "ERR_ATTACK_CANCEL_NOT_FOUND",
		}
		return nil, e
	}

	gorankusu.cancelq <- true

	return rr, nil
}

// RegisterNavLink register custom navigation link.
func (gorankusu *Gorankusu) RegisterNavLink(nav *NavLink) (err error) {
	if nav == nil {
		return
	}

	err = nav.init()
	if err != nil {
		return fmt.Errorf("RegisterNavLink: %w", err)
	}

	gorankusu.navLinks = append(gorankusu.navLinks, nav)

	return nil
}

// RegisterTarget register Target to be attached to Gorankusu.
func (gorankusu *Gorankusu) RegisterTarget(target *Target) (err error) {
	if target == nil {
		return
	}

	err = target.init()
	if err != nil {
		return fmt.Errorf("RegisterTarget: %w", err)
	}

	gorankusu.targets = append(gorankusu.targets, target)

	return nil
}

// RunHTTP send the HTTP request to the HTTP target defined in RunRequest with
// optional Headers and Parameters.
func (gorankusu *Gorankusu) RunHTTP(req *RunRequest) (res *RunResponse, err error) {
	var origTarget = gorankusu.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	var origHTTPTarget = origTarget.getHTTPTarget(req.HTTPTarget.ID)
	if origHTTPTarget == nil {
		return nil, errInvalidHTTPTarget(req.HTTPTarget.ID)
	}

	req = generateRunRequest(gorankusu.Env, req, origTarget, origHTTPTarget)

	res, err = req.HTTPTarget.Run(req)
	if err != nil {
		return nil, err
	}
	return res, nil
}

// Start the Gorankusu HTTP server that provide user interface for running and
// load testing registered Targets.
func (gorankusu *Gorankusu) Start() (err error) {
	mlog.Outf(`gorankusu: scanning previous attack results...`)

	gorankusu.scanResultsDir()

	mlog.Outf(`gorankusu: starting attack worker...`)
	go gorankusu.workerAttackQueue()

	mlog.Outf(`gorankusu: starting HTTP server at http://%s`, gorankusu.Env.ListenAddress)
	go func() {
		var errStart = gorankusu.Httpd.Start()
		if errStart != nil {
			gorankusu.errq <- errStart
		}
	}()

	err = <-gorankusu.errq

	return err
}

// Stop the Gorankusu HTTP server.
func (gorankusu *Gorankusu) Stop() {
	logp := "gorankusu.Stop"
	mlog.Outf(`=== Stopping the Gorankusu service ...`)

	err := gorankusu.Httpd.Stop(0)
	if err != nil {
		mlog.Errf(`!!! %s: %s`, logp, err)
	}

	if gorankusu.isLoadTesting() {
		gorankusu.cancelq <- true
		<-gorankusu.cancelq
	}

	gorankusu.errq <- nil
}

func (gorankusu *Gorankusu) addHTTPAttackResult(rr *RunRequest) (ok bool) {
	var (
		target     *Target
		httpTarget *HTTPTarget
	)
	for _, target = range gorankusu.targets {
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

func (gorankusu *Gorankusu) isLoadTesting() (b bool) {
	gorankusu.Env.mtx.Lock()
	if gorankusu.Env.AttackRunning != nil {
		b = true
	}
	gorankusu.Env.mtx.Unlock()
	return b
}

func (gorankusu *Gorankusu) getTargetByID(id string) *Target {
	for _, target := range gorankusu.targets {
		if target.ID == id {
			return target
		}
	}
	return nil
}

func (gorankusu *Gorankusu) getAttackResultByName(name string) (t *Target, ht *HTTPTarget, result *AttackResult, err error) {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code: http.StatusNotFound,
			Name: "ERR_ATTACK_RESULT_NOT_FOUND",
		},
	}

	t, ht = gorankusu.getTargetByResultFilename(name)
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

func (gorankusu *Gorankusu) getTargetByResultFilename(name string) (t *Target, ht *HTTPTarget) {
	names := strings.Split(name, ".")

	t = gorankusu.getTargetByID(names[0])
	if t == nil {
		return t, nil
	}

	if len(names) > 0 {
		ht = t.getHTTPTarget(names[1])
	}

	return t, ht
}

// scanResultsDir scan the environment's ResultsDir for the past attack
// results and add it to each target based on ID on file name.
//
// Due to size of file can be big (maybe more than 5000 records), this
// function only parse the file name and append it to Results field.
func (gorankusu *Gorankusu) scanResultsDir() {
	logp := "scanResultsDir"

	dir, err := os.Open(gorankusu.Env.ResultsDir)
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

		t, ht := gorankusu.getTargetByResultFilename(name)
		if t == nil {
			mlog.Outf(`--- %s %d/%d: Target ID not found for %q`, logp, x+1, len(fis), name)
			continue
		}
		if ht == nil {
			mlog.Outf(`--- %s %d/%d: HTTPTarget ID not found for %q`, logp, x+1, len(fis), name)
			continue
		}

		mlog.Outf(`--- %s %d/%d: loading %q with size %d Kb`, logp, x+1, len(fis), name, fi.Size()/1024)

		ht.addResult(gorankusu.Env.ResultsDir, name)
	}

	mlog.Outf(`--- %s: all pass results has been loaded ...`, logp)

	var (
		target     *Target
		httpTarget *HTTPTarget
	)
	for _, target = range gorankusu.targets {
		for _, httpTarget = range target.HTTPTargets {
			httpTarget.sortResults()
		}
	}
}

func (gorankusu *Gorankusu) workerAttackQueue() {
	logp := "workerAttackQueue"

	for rr := range gorankusu.attackq {
		var err error
		gorankusu.Env.AttackRunning = rr

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
			case <-gorankusu.cancelq:
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
				gorankusu.cancelq <- true
			}
		} else {
			err = rr.result.finish()
			if err != nil {
				mlog.Errf(`%s %s: %s`, logp, rr.result.Name, err)
			}

			gorankusu.addHTTPAttackResult(rr)

			mlog.Outf(`%s: %s finished.`, logp, rr.result.Name)
		}

		rr.result = nil
		gorankusu.Env.AttackRunning = nil
	}
}
