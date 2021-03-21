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

	libhttp "github.com/shuLhan/share/lib/http"
	vegeta "github.com/tsenart/vegeta/v12/lib"

	"git.sr.ht/~shulhan/trunks"
)

const (
	pathExampleGet      = "/example/get"
	pathExamplePostForm = "/example/post/form"
)

type Example struct {
	trunks                *trunks.Trunks
	targetExampleGet      vegeta.Target
	targetExamplePostForm vegeta.Target
}

//
// New create, initialize, and setup an example service.
//
func New() (ex *Example, err error) {
	env := &trunks.Environment{
		ResultsDir:    "example/testdata/",
		ResultsSuffix: "example",
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
	if err != nil {
		return err
	}

	err = ex.trunks.Server.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExamplePostForm,
		RequestType:  libhttp.RequestTypeForm,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExamplePostForm,
	})

	return err
}

func (ex *Example) registerTargets() (err error) {
	targetHttp := &trunks.Target{
		Name: "Example",
		Opts: &trunks.AttackOptions{
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
			Headers: trunks.KeyValue{
				"X-Get": "1",
			},
			Params: trunks.KeyValue{
				"Param1": "1",
			},
			Run:         ex.runExampleGet,
			AllowAttack: true,
			Attack:      ex.attackExampleGet,
			PreAttack:   ex.preattackExampleGet,
		}, {
			Name:        "HTTP Post Form",
			Method:      libhttp.RequestMethodPost,
			Path:        pathExamplePostForm,
			RequestType: libhttp.RequestTypeForm,
			Headers: trunks.KeyValue{
				"X-PostForm": "1",
			},
			Params: trunks.KeyValue{
				"Param1": "1",
				"Param2": "a string",
			},
			Run:         ex.runExamplePostForm,
			AllowAttack: true,
			PreAttack:   ex.preattackExamplePostForm,
			Attack:      ex.attackExamplePostForm,
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

func (ex *Example) pathExamplePostForm(epr *libhttp.EndpointRequest) ([]byte, error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Message = pathExamplePostForm
	res.Data = epr.HttpRequest.Form

	return json.Marshal(&res)
}

func (ex *Example) runExampleGet(req *trunks.RunRequest) ([]byte, error) {
	if req.Target.HttpClient == nil {
		req.Target.HttpClient = libhttp.NewClient(req.Target.Opts.BaseUrl, nil, true)
	}
	_, resbody, err := req.Target.HttpClient.Get(
		req.HttpTarget.Path,
		req.HttpTarget.Headers.ToHttpHeader(),
		req.HttpTarget.Params.ToUrlValues())
	if err != nil {
		return nil, err
	}
	return resbody, nil
}

func (ex *Example) preattackExampleGet(rr *trunks.RunRequest) {
	ex.targetExampleGet = vegeta.Target{
		Method: rr.HttpTarget.Method.String(),
		URL:    fmt.Sprintf("%s%s", rr.Target.Opts.BaseUrl, rr.HttpTarget.Path),
		Header: rr.HttpTarget.Headers.ToHttpHeader(),
	}

	q := rr.HttpTarget.Params.ToUrlValues().Encode()
	if len(q) > 0 {
		ex.targetExampleGet.URL += "?" + q
	}

	fmt.Printf("preattackExampleGet: %+v\n", ex.targetExampleGet)
}

func (ex *Example) attackExampleGet(rr *trunks.RunRequest) vegeta.Targeter {
	return func(tgt *vegeta.Target) error {
		rr.HttpTarget.AttackLocker.Lock()
		*tgt = ex.targetExampleGet
		rr.HttpTarget.AttackLocker.Unlock()
		return nil
	}
}

func (ex *Example) runExamplePostForm(req *trunks.RunRequest) ([]byte, error) {
	if req.Target.HttpClient == nil {
		req.Target.HttpClient = libhttp.NewClient(req.Target.Opts.BaseUrl, nil, true)
	}
	_, resbody, err := req.Target.HttpClient.PostForm(
		req.HttpTarget.Path,
		req.HttpTarget.Headers.ToHttpHeader(),
		req.HttpTarget.Params.ToUrlValues())
	if err != nil {
		return nil, err
	}
	return resbody, nil
}

func (ex *Example) preattackExamplePostForm(rr *trunks.RunRequest) {
	ex.targetExamplePostForm = vegeta.Target{
		Method: rr.HttpTarget.Method.String(),
		URL:    fmt.Sprintf("%s%s", rr.Target.Opts.BaseUrl, rr.HttpTarget.Path),
		Header: rr.HttpTarget.Headers.ToHttpHeader(),
	}

	q := rr.HttpTarget.Params.ToUrlValues().Encode()
	if len(q) > 0 {
		ex.targetExamplePostForm.Body = []byte(q)
	}

	fmt.Printf("preattackExamplePostForm: %+v\n", ex.targetExamplePostForm)
}

func (ex *Example) attackExamplePostForm(rr *trunks.RunRequest) vegeta.Targeter {
	return func(tgt *vegeta.Target) error {
		rr.HttpTarget.AttackLocker.Lock()
		*tgt = ex.targetExamplePostForm
		rr.HttpTarget.AttackLocker.Unlock()
		return nil
	}
}
