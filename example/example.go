//
// Package example provide an example how to use the Trunks library from setup
// to creating targets.
//
package example

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"git.sr.ht/~shulhan/trunks"
	libhttp "github.com/shuLhan/share/lib/http"
)

const (
	pathExampleGet = "/example/get"
)

type Example struct {
	trunks *trunks.Trunks
}

//
// New create, initialize, and setup an example service.
//
func New() (ex *Example, err error) {
	env := &trunks.Environment{
		ResultsDir:    "/tmp",
		ResultsSuffix: "_trunks_example",
	}

	ex = &Example{}

	ex.trunks, err = trunks.New(env)
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	err = ex.registerEndpoints()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	err = ex.registerTargets()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	return ex, nil
}

func (ex *Example) Start() (err error) {
	return ex.trunks.Start()
}

func (ex *Example) Stop() {
	ex.trunks.Stop()
}

//
// registerEndpoints register HTTP endpoints for testing.
//
func (ex *Example) registerEndpoints() (err error) {
	err = ex.trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathExampleGet,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleGet,
	})
	return err
}

func (ex *Example) registerTargets() (err error) {
	targetHttp := &trunks.Target{
		Name: "Example HTTP target",
		AttackOpts: &trunks.AttackOptions{
			BaseUrl:       fmt.Sprintf("http://%s", ex.trunks.Env.ListenAddress),
			Duration:      5 * time.Second,
			RatePerSecond: 10,
		},
		Vars: map[string]string{
			"A": "1",
		},
		HttpTargets: []*trunks.HttpTarget{{
			Name:        "HTTP Get",
			Method:      libhttp.RequestMethodGet,
			Path:        pathExampleGet,
			RequestType: libhttp.RequestTypeQuery,
			Params: trunks.KeyValue{
				"Param1": "1",
			},
			Run: ex.runExampleGet,
		}},
	}

	ex.trunks.RegisterTarget(targetHttp)

	return nil
}

func (ex *Example) pathExampleGet(epr *libhttp.EndpointRequest) ([]byte, error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Message = pathExampleGet
	res.Data = epr.HttpRequest.Form

	return json.Marshal(&res)
}

func (ex *Example) runExampleGet(target *trunks.Target, req *trunks.RunRequest) ([]byte, error) {
	if target.HttpClient == nil {
		target.HttpClient = libhttp.NewClient(target.AttackOpts.BaseUrl, nil, true)
	}
	_, resbody, err := target.HttpClient.Get(
		req.HttpTarget.Path,
		req.HttpTarget.Headers.ToHttpHeader(),
		req.HttpTarget.Params.ToUrlValues())
	if err != nil {
		return nil, err
	}
	return resbody, nil
}
