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

	"git.sr.ht/~shulhan/ciigo"
	vegeta "github.com/tsenart/vegeta/v12/lib"

	liberrors "github.com/shuLhan/share/lib/errors"
	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/io"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
	"github.com/shuLhan/share/lib/os/exec"
)

const (
	DefaultAttackDuration      = 10 * time.Second
	DefaultAttackRatePerSecond = 500
	DefaultAttackTimeout       = 30 * time.Second
	DefaultListenAddress       = "127.0.0.1:8217"
	DefaultMaxAttackDuration   = 30 * time.Second
	DefaultMaxAttackRate       = 3000

	// Setting this environment variable will enable trunks development
	// mode.
	envDevelopment = "TRUNKS_DEV"
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
	Env   *Environment
	Httpd *libhttp.Server

	targets []*Target
	attackq chan *RunRequest
	cancelq chan bool
}

//
// New create and initialize new Trunks service.
//
func New(env *Environment) (trunks *Trunks, err error) {
	var (
		logp          = "trunks.New"
		isDevelopment = len(os.Getenv(envDevelopment)) > 0
	)

	err = env.init()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	trunks = &Trunks{
		Env:     env,
		attackq: make(chan *RunRequest, 1),
		cancelq: make(chan bool, 1),
	}

	err = trunks.initHttpServer(isDevelopment)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", logp, err)
	}

	if isDevelopment {
		go watchDocs()
		go watchWww()
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
	return trunks.Httpd.Start()
}

//
// Stop the Trunks HTTP server.
//
func (trunks *Trunks) Stop() {
	mlog.Outf("=== Stopping the Trunks service ...\n")

	err := trunks.Httpd.Stop(0)
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

	switch rr.HttpTarget.RequestType {
	case libhttp.RequestTypeJSON:
		params = rr.HttpTarget.Params.ToJsonObject()
	case libhttp.RequestTypeMultipartForm:
		params = rr.HttpTarget.Params.ToMultipartFormData()
	default:
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

//
// watchDocs a goroutine that watch any changes to .adoc files inside
// "_www/docs" directory and convert them into HTML files.
//
func watchDocs() {
	logp := "watchDocs"
	opts := &ciigo.ConvertOptions{
		Root: "_www/docs",
	}
	err := ciigo.Watch(opts)
	if err != nil {
		mlog.Errf("%s: %s", logp, err)
	}
}

//
// watchWww a goroutine that watch any changes to TypeScript, HTML, and
// tsconfig files inside the _www, and when there is an update it will execute
// "tsc -p" to recompile and "go run ./internal/generate-memfs" to embed them
// into Go source.
//
func watchWww() {
	logp := "watchWww"
	commands := []string{
		"tsc -p _www/tsconfig.json",
		"go run ./internal/generate-memfs",
	}

	dirWatcher := &io.DirWatcher{
		Options: memfs.Options{
			Root: "_www",
			Includes: []string{
				`\.*.ts$`,
				`_www/index.html$`,
				`_www/tsconfig.json$`,
			},
			Excludes: []string{
				`\.*.d.ts$`,
			},
		},
		Callback: func(ns *io.NodeState) {
			for _, cmd := range commands {
				mlog.Outf("%s: %s\n", logp, cmd)
				err := exec.Run(cmd, nil, nil)
				if err != nil {
					mlog.Errf("%s: %s", logp, err)
					return
				}
			}
		},
	}
	err := dirWatcher.Start()
	if err != nil {
		mlog.Errf("%s: %s", logp, err)
	}
}
