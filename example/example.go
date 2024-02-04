// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// Package example provide an example how to use the Gorankusu library from
// setting it up to creating targets.
//
// To run the example, execute
//
//	$ go run ./internal/cmd/gorankusu
//
// It will run a web user interface at http://127.0.0.1:8217 .
package example

import (
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/url"
	"sync"
	"time"

	liberrors "github.com/shuLhan/share/lib/errors"
	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/mlog"
	"github.com/shuLhan/share/lib/websocket"
	vegeta "github.com/tsenart/vegeta/v12/lib"

	"git.sr.ht/~shulhan/gorankusu"
)

const (
	pathExample         = `/example`
	pathExampleError    = `/example/error`
	pathExampleNamePage = `/example/:name/page`
	pathExampleUpload   = `/example/upload`
)

const (
	websocketAddress = "127.0.0.1:28240"
)

type requestResponse struct {
	Method        string
	URL           string
	Headers       http.Header
	Form          url.Values
	MultipartForm *multipart.Form
	Body          string
}

// Example contains an example how to use Gorankusu programmatically.
type Example struct {
	gorankusu   *gorankusu.Gorankusu
	wsServer *websocket.Server

	targetExampleErrorGet vegeta.Target
	targetExampleGet      vegeta.Target
	targetExamplePostForm vegeta.Target
}

// New create, initialize, and setup an example service.
func New() (ex *Example, err error) {
	env := &gorankusu.Environment{
		ResultsDir:    "example/testdata/",
		ResultsSuffix: "example",
	}

	ex = &Example{}

	ex.gorankusu, err = gorankusu.New(env)
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	err = ex.registerEndpoints()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	// Create and register endpoint for WebSocket server.
	wsOpts := &websocket.ServerOptions{
		Address: websocketAddress,
	}

	ex.wsServer = websocket.NewServer(wsOpts)

	err = ex.registerWebSocketEndpoints()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	// Register target for testing HTTP endpoints.
	err = ex.registerTargetHTTP()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	// Register target for testing WebSocket endpoints.
	err = ex.registerTargetWebSocket()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	err = ex.registerNavLinks()
	if err != nil {
		return nil, fmt.Errorf("example: New: %w", err)
	}

	return ex, nil
}

// Start the Example servers.
func (ex *Example) Start() (err error) {
	go func() {
		err = ex.wsServer.Start()
		if err != nil {
			mlog.Errf(`example.Start: %s`, err)
		}
	}()

	return ex.gorankusu.Start()
}

// Stop the Example servers.
func (ex *Example) Stop() {
	ex.wsServer.Stop()
	ex.gorankusu.Stop()
}

// registerEndpoints register HTTP endpoints for testing.
func (ex *Example) registerEndpoints() (err error) {
	err = ex.gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathExample,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleGet,
	})
	if err != nil {
		return err
	}

	err = ex.gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathExampleError,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleErrorGet,
	})
	if err != nil {
		return err
	}

	err = ex.gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExample,
		RequestType:  libhttp.RequestTypeForm,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExamplePost,
	})

	err = ex.gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExampleNamePage,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExamplePost,
	})

	err = ex.gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExampleUpload,
		RequestType:  libhttp.RequestTypeMultipartForm,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleUpload,
	})

	return err
}

func (ex *Example) registerWebSocketEndpoints() (err error) {
	err = ex.wsServer.RegisterTextHandler(http.MethodGet, pathExample,
		ex.handleWSExampleGet)
	if err != nil {
		return err
	}
	return nil
}

func (ex *Example) registerTargetHTTP() (err error) {
	var targetHTTP = &gorankusu.Target{
		Name:    "Example HTTP",
		Hint:    "This section provide an example of HTTP endpoints that can be tested and attacked.",
		BaseURL: fmt.Sprintf(`http://%s`, ex.gorankusu.Env.ListenAddress),
		Opts: &gorankusu.AttackOptions{
			Duration:      300 * time.Second,
			RatePerSecond: 1,
		},
		Vars: gorankusu.KeyFormInput{
			"A": gorankusu.FormInput{
				Label: "A",
				Hint:  "This is the global variabel for all HTTP targets below.",
				Kind:  gorankusu.FormInputKindNumber,
				Value: "1",
			},
		},
		HTTPTargets: []*gorankusu.HTTPTarget{{
			Name:        "HTTP Get",
			Hint:        fmt.Sprintf("Test or attack endpoint %q using HTTP GET.", pathExample),
			Method:      libhttp.RequestMethodGet,
			Path:        pathExample,
			RequestType: libhttp.RequestTypeQuery,
			Headers: gorankusu.KeyFormInput{
				"X-Get": gorankusu.FormInput{
					Label: "X-Get",
					Hint:  "Custom HTTP header to be send.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "1.1",
				},
			},
			Params: gorankusu.KeyFormInput{
				"Param1": gorankusu.FormInput{
					Label: "Param1",
					Hint:  "Parameter with number.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "1",
				},
			},
			Run:         ex.runExampleGet,
			AllowAttack: true,
			Attack:      ex.attackExampleGet,
			PreAttack:   ex.preattackExampleGet,
		}, {
			Name:        "HTTP Error Get",
			Hint:        fmt.Sprintf("Test error on endpoint %q using HTTP GET.", pathExampleError),
			Method:      libhttp.RequestMethodGet,
			Path:        pathExampleError,
			RequestType: libhttp.RequestTypeQuery,
			Headers: gorankusu.KeyFormInput{
				"X-Get": gorankusu.FormInput{
					Label: "X-Get",
					Hint:  "Custom HTTP header to be send.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "1.1",
				},
			},
			Params: gorankusu.KeyFormInput{
				"Param1": gorankusu.FormInput{
					Label: "Param1",
					Hint:  "Parameter with number.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "1",
				},
			},
			Run:         ex.runExampleGet,
			AllowAttack: true,
			Attack:      ex.attackExampleErrorGet,
			PreAttack:   ex.preattackExampleErrorGet,
		}, {
			Name:        "HTTP Post Form",
			Hint:        fmt.Sprintf("Test or attack endpoint %q using HTTP POST.", pathExample),
			Method:      libhttp.RequestMethodPost,
			Path:        pathExample,
			RequestType: libhttp.RequestTypeForm,
			Headers: gorankusu.KeyFormInput{
				"X-PostForm": gorankusu.FormInput{
					Label: "X-PostForm",
					Hint:  "Custom HTTP header to be send.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "1",
				},
			},
			Params: gorankusu.KeyFormInput{
				"Param1": gorankusu.FormInput{
					Label: "Param1",
					Hint:  "Parameter with number.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "1",
				},
				"Param2": gorankusu.FormInput{
					Label: "Param2",
					Hint:  "Parameter with string.",
					Kind:  gorankusu.FormInputKindString,
					Value: "a string",
				},
			},
			Run:         ex.runExamplePostForm,
			AllowAttack: true,
			PreAttack:   ex.preattackExamplePostForm,
			Attack:      ex.attackExamplePostForm,
		}, {
			Name:        "HTTP free form",
			Hint:        fmt.Sprintf("Test endpoint %q using custom HTTP method and/or content type.", pathExample),
			Method:      libhttp.RequestMethodGet,
			Path:        pathExample,
			RequestType: libhttp.RequestTypeForm,
			Headers: gorankusu.KeyFormInput{
				"X-FreeForm": gorankusu.FormInput{
					Label: "X-FreeForm",
					Hint:  "Custom HTTP header to be send.",
					Kind:  gorankusu.FormInputKindString,
					Value: "1",
				},
			},
			Params: gorankusu.KeyFormInput{
				"Param1": gorankusu.FormInput{
					Label: "Param1",
					Hint:  "Parameter with number.",
					Kind:  gorankusu.FormInputKindNumber,
					Value: "123",
				},
			},
			IsCustomizable: true,
		}, {
			Name:        `HTTP Post path binding`,
			Hint:        `Test parameter with parameter in path`,
			Method:      libhttp.RequestMethodPost,
			Path:        pathExampleNamePage,
			RequestType: libhttp.RequestTypeJSON,
			Params: gorankusu.KeyFormInput{
				`name`: gorankusu.FormInput{
					Label: `Name`,
					Hint:  `This parameter send in path.`,
					Value: `testname`,
				},
				`id`: gorankusu.FormInput{
					Label: `ID`,
					Hint:  `This parameter send in body as JSON.`,
					Value: `123`,
				},
			},
		}, {
			Name:        `HTTP upload`,
			Hint:        `Test uploading file`,
			Method:      libhttp.RequestMethodPost,
			Path:        pathExampleUpload,
			RequestType: libhttp.RequestTypeMultipartForm,
			Params: gorankusu.KeyFormInput{
				`file`: gorankusu.FormInput{
					Label: `File`,
					Hint:  `File to be uploaded.`,
					Kind:  gorankusu.FormInputKindFile,
					FormDataName: func(key string) string {
						if key == gorankusu.FormDataFilename {
							return `name`
						}
						return key
					},
				},
				`agree`: gorankusu.FormInput{
					Label: `Agree`,
					Hint:  `Additional parameter along file.`,
					Kind:  gorankusu.FormInputKindBoolean,
				},
			},
		}},
	}

	err = ex.gorankusu.RegisterTarget(targetHTTP)
	if err != nil {
		return err
	}
	return nil
}

func (ex *Example) registerTargetWebSocket() (err error) {
	targetWebSocket := &gorankusu.Target{
		Name:    "Example WebSocket",
		Hint:    "This section provide an example of WebSocket endpoints that can be tested.",
		BaseURL: fmt.Sprintf(`ws://%s`, websocketAddress),
		Opts:    &gorankusu.AttackOptions{},
		Vars: gorankusu.KeyFormInput{
			"WebSocketVar": gorankusu.FormInput{
				Label: "WebSocketVar",
				Kind:  gorankusu.FormInputKindString,
				Value: "hello",
			},
		},
		WebSocketTargets: []*gorankusu.WebSocketTarget{{
			Name: "Similar to HTTP GET",
			Hint: "Test WebSocket endpoint with parameters.",
			Params: gorankusu.KeyFormInput{
				"Param1": gorankusu.FormInput{
					Label: "Param1",
					Hint:  "Parameter with kind is number.",
					Kind:  "number",
					Value: "123",
				},
			},
			Run: ex.runWebSocketGet,
		}},
	}

	err = ex.gorankusu.RegisterTarget(targetWebSocket)
	if err != nil {
		return err
	}

	return nil
}

func (ex *Example) registerNavLinks() (err error) {
	logp := "registerNavLinks"

	err = ex.gorankusu.RegisterNavLink(&gorankusu.NavLink{
		Text:         "Link in IFrame",
		Href:         "https://git.sr.ht/~shulhan/gorankusu",
		OpenInIFrame: true,
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	err = ex.gorankusu.RegisterNavLink(&gorankusu.NavLink{
		Text: "Link in new window",
		Href: "https://git.sr.ht/~shulhan/gorankusu",
	})
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}

func (ex *Example) pathExampleGet(epr *libhttp.EndpointRequest) ([]byte, error) {
	data := &requestResponse{
		Method:        epr.HttpRequest.Method,
		URL:           epr.HttpRequest.URL.String(),
		Headers:       epr.HttpRequest.Header,
		Form:          epr.HttpRequest.Form,
		MultipartForm: epr.HttpRequest.MultipartForm,
		Body:          string(epr.RequestBody),
	}

	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Message = pathExample
	res.Data = data

	return json.Marshal(&res)
}

func (ex *Example) pathExampleErrorGet(_ *libhttp.EndpointRequest) ([]byte, error) {
	return nil, liberrors.Internal(fmt.Errorf("server error"))
}

func (ex *Example) pathExamplePost(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	data := &requestResponse{
		Method:        epr.HttpRequest.Method,
		URL:           epr.HttpRequest.URL.String(),
		Headers:       epr.HttpRequest.Header,
		Form:          epr.HttpRequest.Form,
		MultipartForm: epr.HttpRequest.MultipartForm,
		Body:          string(epr.RequestBody),
	}

	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Message = pathExample
	res.Data = data

	return json.Marshal(&res)
}

func (ex *Example) pathExampleUpload(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var logp = `pathExampleUpload`

	var res = libhttp.EndpointResponse{}

	res.Code = http.StatusOK
	res.Data = epr.HttpRequest.MultipartForm.Value

	resb, err = json.Marshal(res)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	return resb, nil
}

func (ex *Example) runExampleGet(req *gorankusu.RunRequest) (res *gorankusu.RunResponse, err error) {
	if req.Target.HTTPClient == nil {
		var httpcOpts = &libhttp.ClientOptions{
			ServerUrl:     req.Target.BaseURL,
			AllowInsecure: true,
		}
		req.Target.HTTPClient = libhttp.NewClient(httpcOpts)
	}

	res = &gorankusu.RunResponse{}

	var (
		headers = req.HTTPTarget.Headers.ToHTTPHeader()
		params  = req.HTTPTarget.Params.ToURLValues()

		httpRequest *http.Request
	)

	httpRequest, err = req.Target.HTTPClient.GenerateHttpRequest(
		req.HTTPTarget.Method,
		req.HTTPTarget.Path,
		req.HTTPTarget.RequestType,
		headers,
		params,
	)
	if err != nil {
		return nil, err
	}

	err = res.SetHTTPRequest(req.HTTPTarget.RequestDumper, httpRequest)
	if err != nil {
		return nil, err
	}

	var httpResponse *http.Response

	httpResponse, _, err = req.Target.HTTPClient.Do(httpRequest)
	if err != nil {
		return nil, err
	}

	err = res.SetHTTPResponse(req.HTTPTarget.ResponseDumper, httpResponse)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (ex *Example) preattackExampleErrorGet(rr *gorankusu.RunRequest) {
	ex.targetExampleErrorGet = vegeta.Target{
		Method: rr.HTTPTarget.Method.String(),
		URL:    fmt.Sprintf("%s%s", rr.Target.BaseURL, rr.HTTPTarget.Path),
		Header: rr.HTTPTarget.Headers.ToHTTPHeader(),
	}

	q := rr.HTTPTarget.Params.ToURLValues().Encode()
	if len(q) > 0 {
		ex.targetExampleErrorGet.URL += "?" + q
	}

	fmt.Printf("preattackExampleErrorGet: %+v\n", ex.targetExampleErrorGet)
}

func (ex *Example) preattackExampleGet(rr *gorankusu.RunRequest) {
	ex.targetExampleGet = vegeta.Target{
		Method: rr.HTTPTarget.Method.String(),
		URL:    fmt.Sprintf("%s%s", rr.Target.BaseURL, rr.HTTPTarget.Path),
		Header: rr.HTTPTarget.Headers.ToHTTPHeader(),
	}

	q := rr.HTTPTarget.Params.ToURLValues().Encode()
	if len(q) > 0 {
		ex.targetExampleGet.URL += "?" + q
	}

	fmt.Printf("preattackExampleGet: %+v\n", ex.targetExampleGet)
}

func (ex *Example) attackExampleErrorGet(rr *gorankusu.RunRequest) vegeta.Targeter {
	return func(tgt *vegeta.Target) error {
		rr.HTTPTarget.Lock()
		*tgt = ex.targetExampleErrorGet
		rr.HTTPTarget.Unlock()
		return nil
	}
}

func (ex *Example) attackExampleGet(rr *gorankusu.RunRequest) vegeta.Targeter {
	return func(tgt *vegeta.Target) error {
		rr.HTTPTarget.Lock()
		*tgt = ex.targetExampleGet
		rr.HTTPTarget.Unlock()
		return nil
	}
}

func (ex *Example) runExamplePostForm(req *gorankusu.RunRequest) (res *gorankusu.RunResponse, err error) {
	if req.Target.HTTPClient == nil {
		httpcOpts := &libhttp.ClientOptions{
			ServerUrl:     req.Target.BaseURL,
			AllowInsecure: true,
		}
		req.Target.HTTPClient = libhttp.NewClient(httpcOpts)
	}

	res = &gorankusu.RunResponse{}

	headers := req.HTTPTarget.Headers.ToHTTPHeader()
	params := req.HTTPTarget.Params.ToURLValues()

	httpRequest, err := req.Target.HTTPClient.GenerateHttpRequest(
		req.HTTPTarget.Method,
		req.HTTPTarget.Path,
		req.HTTPTarget.RequestType,
		headers,
		params,
	)
	if err != nil {
		return nil, err
	}

	err = res.SetHTTPRequest(req.HTTPTarget.RequestDumper, httpRequest)
	if err != nil {
		return nil, err
	}

	httpResponse, _, err := req.Target.HTTPClient.Do(httpRequest)
	if err != nil {
		return nil, err
	}

	err = res.SetHTTPResponse(req.HTTPTarget.ResponseDumper, httpResponse)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (ex *Example) preattackExamplePostForm(rr *gorankusu.RunRequest) {
	ex.targetExamplePostForm = vegeta.Target{
		Method: rr.HTTPTarget.Method.String(),
		URL:    fmt.Sprintf("%s%s", rr.Target.BaseURL, rr.HTTPTarget.Path),
		Header: rr.HTTPTarget.Headers.ToHTTPHeader(),
	}

	q := rr.HTTPTarget.Params.ToURLValues().Encode()
	if len(q) > 0 {
		ex.targetExamplePostForm.Body = []byte(q)
	}

	fmt.Printf("preattackExamplePostForm: %+v\n", ex.targetExamplePostForm)
}

func (ex *Example) attackExamplePostForm(rr *gorankusu.RunRequest) vegeta.Targeter {
	return func(tgt *vegeta.Target) error {
		rr.HTTPTarget.Lock()
		*tgt = ex.targetExamplePostForm
		rr.HTTPTarget.Unlock()
		return nil
	}
}

func (ex *Example) handleWSExampleGet(_ context.Context, req *websocket.Request) (res websocket.Response) {
	res.ID = req.ID
	res.Code = http.StatusOK
	res.Body = req.Body
	return res
}

func (ex *Example) runWebSocketGet(rr *gorankusu.RunRequest) (res interface{}, err error) {
	var wg sync.WaitGroup

	wsc := &websocket.Client{
		Endpoint: "ws://" + websocketAddress,
		HandleText: func(_ *websocket.Client, frame *websocket.Frame) error {
			res = frame.Payload()
			wg.Done()
			return nil
		},
	}

	err = wsc.Connect()
	if err != nil {
		return nil, err
	}

	body, err := json.Marshal(rr.WebSocketTarget.Params)
	if err != nil {
		return nil, err
	}

	req := websocket.Request{
		ID:     uint64(time.Now().UnixNano()),
		Method: http.MethodGet,
		Target: pathExample,
		Body:   string(body),
	}

	reqtext, err := json.Marshal(&req)
	if err != nil {
		return nil, err
	}

	err = wsc.SendText(reqtext)
	if err != nil {
		return nil, err
	}
	wg.Add(1)
	wg.Wait()

	_ = wsc.Close()

	return res, nil
}
