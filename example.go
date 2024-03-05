// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	liberrors "git.sr.ht/~shulhan/pakakeh.go/lib/errors"
	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
	"git.sr.ht/~shulhan/pakakeh.go/lib/mlog"
	"git.sr.ht/~shulhan/pakakeh.go/lib/websocket"
)

const (
	pathExample            = `/example`
	pathExampleError       = `/example/error`
	pathExampleNamePage    = `/example/:name/page`
	pathExampleRawbodyJSON = `/example/rawbody/json`
	pathExampleUpload      = `/example/upload`
)

// List of custom headers.
const (
	headerNameXResponseCode = `X-Response-Code`
)

const (
	websocketAddress = `127.0.0.1:28240`
)

type requestResponse struct {
	Method        string
	URL           string
	Headers       http.Header
	Form          url.Values
	MultipartForm *multipart.Form
	Body          string
}

// Example provide an example how to use the Gorankusu library from setting
// it up to creating targets.
//
// To run the example, execute
//
//	$ go run ./internal/cmd/gorankusu
//
// It will run a web user interface at http://127.0.0.1:8217 .
type Example struct {
	*Gorankusu
	wsServer *websocket.Server
}

// NewExample create, initialize, and setup an example of Gorankusu.
func NewExample(listenAddress string, isDev bool) (ex *Example, err error) {
	var logp = `NewExample`

	var env = &Environment{
		ListenAddress: listenAddress,
		ResultsDir:    `testdata/example/`,
		ResultsSuffix: `example`,
		IsDevelopment: isDev,
	}

	ex = &Example{}

	ex.Gorankusu, err = New(env)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	err = ex.registerEndpoints()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	// Create and register endpoint for WebSocket server.
	var wsOpts = &websocket.ServerOptions{
		Address: websocketAddress,
	}

	ex.wsServer = websocket.NewServer(wsOpts)

	err = ex.registerWebSocketEndpoints()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	// Register target for testing HTTP endpoints.
	err = ex.registerTargetHTTP()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	// Register target for testing WebSocket endpoints.
	err = ex.registerTargetWebSocket()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	err = ex.registerNavLinks()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
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

	return ex.Gorankusu.Start()
}

// Stop the Example servers.
func (ex *Example) Stop() {
	ex.wsServer.Stop()
	ex.Gorankusu.Stop()
}

// registerEndpoints register HTTP endpoints for testing.
func (ex *Example) registerEndpoints() (err error) {
	err = ex.Gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathExample,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleGet,
	})
	if err != nil {
		return err
	}

	err = ex.Gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathExampleError,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleErrorGet,
	})
	if err != nil {
		return err
	}

	err = ex.Gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExample,
		RequestType:  libhttp.RequestTypeForm,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExamplePost,
	})
	if err != nil {
		return err
	}

	err = ex.Gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExampleNamePage,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExamplePost,
	})
	if err != nil {
		return err
	}

	err = ex.Gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExampleRawbodyJSON,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleRawbodyJSON,
	})
	if err != nil {
		return err
	}

	err = ex.Gorankusu.Httpd.RegisterEndpoint(&libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathExampleUpload,
		RequestType:  libhttp.RequestTypeMultipartForm,
		ResponseType: libhttp.ResponseTypeJSON,
		Call:         ex.pathExampleUpload,
	})
	if err != nil {
		return err
	}

	return nil
}

func (ex *Example) registerWebSocketEndpoints() (err error) {
	err = ex.wsServer.RegisterTextHandler(http.MethodGet, pathExample, ex.handleWSExampleGet)
	if err != nil {
		return err
	}
	return nil
}

func (ex *Example) registerTargetHTTP() (err error) {
	const headerAuthorization = `Authorization`

	var targetHTTP = &Target{
		ID:      `example_http`,
		Name:    `Example HTTP`,
		Hint:    `This section provide an example of HTTP endpoints that can be tested and attacked.`,
		BaseURL: fmt.Sprintf(`http://%s`, ex.Gorankusu.Env.ListenAddress),
		Opts: AttackOptions{
			Duration:      10 * time.Second,
			RatePerSecond: 1,
		},
		Headers: KeyFormInput{
			headerAuthorization: FormInput{
				Label: `Authorization`,
				Hint:  `Global authorization header.`,
			},
		},
		Vars: KeyFormInput{
			`A`: FormInput{
				Label: `A`,
				Hint:  `This is the global variabel for all HTTP targets below.`,
				Kind:  FormInputKindNumber,
				Value: `1`,
			},
		},
		HTTPTargets: []*HTTPTarget{{
			ID:          `http_get`,
			Name:        `HTTP Get`,
			Hint:        fmt.Sprintf(`Test or attack endpoint %q using HTTP GET.`, pathExample),
			Method:      libhttp.RequestMethodGet,
			Path:        pathExample,
			RequestType: libhttp.RequestTypeQuery,
			Headers: KeyFormInput{
				headerAuthorization: FormInput{
					Label: `Authorization`,
					Hint:  `Global authorization header.`,
				},
				`X-Get`: FormInput{
					Label: `X-Get`,
					Hint:  `Custom HTTP header to be send.`,
					Kind:  FormInputKindNumber,
					Value: `1.1`,
				},
			},
			Params: KeyFormInput{
				`Param1`: FormInput{
					Label: `Param1`,
					Hint:  `Parameter with number.`,
					Kind:  FormInputKindNumber,
					Value: `1`,
				},
			},
			AllowAttack:    true,
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
		}, {
			ID:          `http_error_get`,
			Name:        `HTTP Error Get`,
			Hint:        fmt.Sprintf(`Test error on endpoint %q using HTTP GET.`, pathExampleError),
			Method:      libhttp.RequestMethodGet,
			Path:        pathExampleError,
			RequestType: libhttp.RequestTypeQuery,
			Headers: KeyFormInput{
				`X-Get`: FormInput{
					Label: `X-Get`,
					Hint:  `Custom HTTP header to be send.`,
					Kind:  FormInputKindNumber,
					Value: `1.1`,
				},
			},
			Params: KeyFormInput{
				`Param1`: FormInput{
					Label: `Param1`,
					Hint:  `Parameter with number.`,
					Kind:  FormInputKindNumber,
					Value: `1`,
				},
			},
			AllowAttack:    true,
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
		}, {
			ID:          `http_post_form`,
			Name:        `HTTP Post Form`,
			Hint:        fmt.Sprintf(`Test or attack endpoint %q using HTTP POST.`, pathExample),
			Method:      libhttp.RequestMethodPost,
			Path:        pathExample,
			RequestType: libhttp.RequestTypeForm,
			Headers: KeyFormInput{
				headerNameXResponseCode: FormInput{
					Label: headerNameXResponseCode,
					Hint:  `Custom HTTP header to be send.`,
				},
			},
			Params: KeyFormInput{
				`Param1`: FormInput{
					Label: `Param1`,
					Hint:  `Parameter with number.`,
					Kind:  FormInputKindNumber,
					Value: `1`,
				},
				`Param2`: FormInput{
					Label: `Param2`,
					Hint:  `Parameter with string.`,
					Kind:  FormInputKindString,
					Value: `a string`,
				},
			},
			AllowAttack:    true,
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
		}, {
			ID:          `http_free_form`,
			Name:        `HTTP Free Form`,
			Hint:        fmt.Sprintf(`Test endpoint %q using custom HTTP method and/or content type.`, pathExample),
			Method:      libhttp.RequestMethodGet,
			Path:        pathExample,
			RequestType: libhttp.RequestTypeForm,
			Headers: KeyFormInput{
				`X-FreeForm`: FormInput{
					Label: `X-FreeForm`,
					Hint:  `Custom HTTP header to be send.`,
					Kind:  FormInputKindString,
					Value: `1`,
				},
			},
			Params: KeyFormInput{
				`Param1`: FormInput{
					Label: `Param1`,
					Hint:  `Parameter with number.`,
					Kind:  FormInputKindNumber,
					Value: `123`,
				},
			},
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
			IsCustomizable: true,
			AllowAttack:    true,
		}, {
			ID:          `http_post_path_binding`,
			Name:        `HTTP Post path binding`,
			Hint:        `Test parameter with parameter in path`,
			Method:      libhttp.RequestMethodPost,
			Path:        pathExampleNamePage,
			RequestType: libhttp.RequestTypeJSON,
			Params: KeyFormInput{
				`name`: FormInput{
					Label: `Name`,
					Hint:  `This parameter send in path.`,
					Value: `testname`,
				},
				`id`: FormInput{
					Label: `ID`,
					Hint:  `This parameter send in body as JSON.`,
					Value: `123`,
				},
			},
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
			AllowAttack:    true,
		}, {
			ID:             `http_rawbody_json`,
			Name:           `HTTP raw body - JSON`,
			Hint:           `Test POST request with manually input raw JSON.`,
			Method:         libhttp.RequestMethodPost,
			Path:           pathExampleRawbodyJSON,
			RequestType:    libhttp.RequestTypeJSON,
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
			WithRawBody:    true,
			AllowAttack:    true,
		}, {
			ID:          `http_upload`,
			Name:        `HTTP upload`,
			Hint:        `Test uploading file`,
			Method:      libhttp.RequestMethodPost,
			Path:        pathExampleUpload,
			RequestType: libhttp.RequestTypeMultipartForm,
			Params: KeyFormInput{
				`file`: FormInput{
					Label: `File`,
					Hint:  `File to be uploaded.`,
					Kind:  FormInputKindFile,
					FormDataName: func(key string) string {
						if key == FormDataFilename {
							return `name`
						}
						return key
					},
				},
				`agree`: FormInput{
					Label: `Agree`,
					Hint:  `Additional parameter along file.`,
					Kind:  FormInputKindBoolean,
				},
			},
			RequestDumper:  requestDumperWithoutDate,
			ResponseDumper: responseDumperWithoutDate,
			AllowAttack:    true,
		}},
	}

	err = ex.Gorankusu.RegisterTarget(targetHTTP)
	if err != nil {
		return err
	}
	return nil
}

func (ex *Example) registerTargetWebSocket() (err error) {
	var targetWebSocket = &Target{
		ID:      `example_websocket`,
		Name:    `Example WebSocket`,
		Hint:    `This section provide an example of WebSocket endpoints that can be tested.`,
		BaseURL: fmt.Sprintf(`ws://%s`, websocketAddress),
		Vars: KeyFormInput{
			`WebSocketVar`: FormInput{
				Label: `WebSocketVar`,
				Kind:  FormInputKindString,
				Value: `hello`,
			},
		},
		WebSocketTargets: []*WebSocketTarget{{
			ID:   `ws_get`,
			Name: `Similar to HTTP GET`,
			Hint: `Test WebSocket endpoint with parameters.`,
			Params: KeyFormInput{
				`Param1`: FormInput{
					Label: `Param1`,
					Hint:  `Parameter with kind is number.`,
					Kind:  `number`,
					Value: `123`,
				},
			},
			Run: ex.runWebSocketGet,
		}},
	}

	err = ex.Gorankusu.RegisterTarget(targetWebSocket)
	if err != nil {
		return err
	}

	return nil
}

func (ex *Example) registerNavLinks() (err error) {
	var logp = `registerNavLinks`

	err = ex.Gorankusu.RegisterNavLink(&NavLink{
		Text:         `Link in IFrame`,
		Href:         `https://git.sr.ht/~shulhan/gorankusu`,
		OpenInIFrame: true,
	})
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	err = ex.Gorankusu.RegisterNavLink(&NavLink{
		Text: `Link in new window`,
		Href: `https://git.sr.ht/~shulhan/gorankusu`,
	})
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	return nil
}

func (ex *Example) pathExampleGet(epr *libhttp.EndpointRequest) ([]byte, error) {
	var data = &requestResponse{
		Method:        epr.HTTPRequest.Method,
		URL:           epr.HTTPRequest.URL.String(),
		Headers:       epr.HTTPRequest.Header,
		Form:          epr.HTTPRequest.Form,
		MultipartForm: epr.HTTPRequest.MultipartForm,
		Body:          string(epr.RequestBody),
	}

	var res = libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Message = pathExample
	res.Data = data

	return json.Marshal(&res)
}

func (ex *Example) pathExampleErrorGet(_ *libhttp.EndpointRequest) ([]byte, error) {
	return nil, liberrors.Internal(fmt.Errorf(`server error`))
}

func (ex *Example) pathExamplePost(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var data = &requestResponse{
		Method:        epr.HTTPRequest.Method,
		URL:           epr.HTTPRequest.URL.String(),
		Headers:       epr.HTTPRequest.Header,
		Form:          epr.HTTPRequest.Form,
		MultipartForm: epr.HTTPRequest.MultipartForm,
		Body:          string(epr.RequestBody),
	}

	var (
		hdrXResponseCode = epr.HTTPRequest.Header.Get(headerNameXResponseCode)
		expRespCode      int64
	)
	expRespCode, err = strconv.ParseInt(hdrXResponseCode, 10, 64)
	if err != nil {
		expRespCode = http.StatusOK
	}

	var res = libhttp.EndpointResponse{}

	res.Code = int(expRespCode)
	res.Message = pathExample
	res.Data = data

	epr.HTTPWriter.Header().Set(libhttp.HeaderContentType, epr.Endpoint.ResponseType.String())
	epr.HTTPWriter.WriteHeader(res.Code)

	return json.Marshal(&res)
}

func (ex *Example) pathExampleRawbodyJSON(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	var (
		logp = `pathExampleRawbodyJSON`
		data map[string]any
	)

	err = json.Unmarshal(epr.RequestBody, &data)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	var res = libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = data

	resbody, err = json.Marshal(&res)
	return resbody, err
}

func (ex *Example) pathExampleUpload(epr *libhttp.EndpointRequest) (resb []byte, err error) {
	var logp = `pathExampleUpload`

	var res = libhttp.EndpointResponse{}

	res.Code = http.StatusOK
	res.Data = epr.HTTPRequest.MultipartForm.Value

	resb, err = json.MarshalIndent(res, ``, `  `)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	return resb, nil
}

func (ex *Example) handleWSExampleGet(_ context.Context, req *websocket.Request) (res websocket.Response) {
	res.ID = req.ID
	res.Code = http.StatusOK
	res.Body = req.Body
	return res
}

func (ex *Example) runWebSocketGet(rr *RunRequest) (res interface{}, err error) {
	var wg sync.WaitGroup

	var wsc = &websocket.Client{
		Endpoint: `ws://` + websocketAddress,
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

	var body []byte

	body, err = json.Marshal(rr.WebSocketTarget.Params)
	if err != nil {
		return nil, err
	}

	var req = websocket.Request{
		ID:     uint64(time.Now().UnixNano()),
		Method: http.MethodGet,
		Target: pathExample,
		Body:   string(body),
	}

	var reqtext []byte

	reqtext, err = json.Marshal(&req)
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

func requestDumperWithoutDate(req *http.Request) ([]byte, error) {
	req.Header.Del(libhttp.HeaderDate)
	return DefaultRequestDumper()(req)
}

func responseDumperWithoutDate(resp *http.Response) ([]byte, error) {
	resp.Header.Del(libhttp.HeaderDate)
	return DefaultResponseDumper()(resp)
}
