// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"encoding/json"
	"fmt"
	"net/http"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/memfs"
)

// List of HTTP APIs.
const (
	pathAPIAttackHTTP   = `/_gorankusu/api/attack/http`
	pathAPIAttackResult = `/_gorankusu/api/attack/result`

	pathAPIEnvironment = `/_gorankusu/api/environment`
	pathAPINavlinks    = `/_gorankusu/api/navlinks`

	pathAPITargetRunHTTP      = `/_gorankusu/api/target/run/http`
	pathAPITargetRunWebSocket = `/_gorankusu/api/target/run/websocket`
	pathAPITargets            = `/_gorankusu/api/targets`
)

// List of HTTP parameters.
const (
	paramNameName = "name"
)

// List of HTTP APIs provided by Gorankusu HTTP server.
var (
	apiEnvironmentGet = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathAPIEnvironment,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiAttackHTTP = libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAPIAttackHTTP,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}
	apiAttackHTTPCancel = libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         pathAPIAttackHTTP,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiAttackResultDelete = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         pathAPIAttackResult,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}
	apiAttackResultGet = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathAPIAttackResult,
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiNavLinks = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathAPINavlinks,
		RequestType:  libhttp.RequestTypeNone,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiTargetRunHTTP = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAPITargetRunHTTP,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}
	apiTargetRunWebSocket = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         pathAPITargetRunWebSocket,
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiTargets = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         pathAPITargets,
		RequestType:  libhttp.RequestTypeNone,
		ResponseType: libhttp.ResponseTypeJSON,
	}
)

func (gorankusu *Gorankusu) initHTTPServer(isDevelopment bool) (err error) {
	var logp = `initHTTPServer`

	if memfsWWW == nil {
		mfsOptions := memfs.Options{
			Root: "_www",
			Includes: []string{
				`.*\.(js|html|ico|png)$`,
			},
			TryDirect: true,
		}
		memfsWWW, err = memfs.New(&mfsOptions)
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	} else {
		memfsWWW.Opts.TryDirect = isDevelopment
	}

	httpdOpts := &libhttp.ServerOptions{
		Memfs:   memfsWWW,
		Address: gorankusu.Env.ListenAddress,
	}

	gorankusu.Httpd, err = libhttp.NewServer(httpdOpts)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiEnvironmentGet.Call = gorankusu.apiEnvironmentGet
	err = gorankusu.Httpd.RegisterEndpoint(apiEnvironmentGet)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiAttackHTTP.Call = gorankusu.apiAttackHTTP
	err = gorankusu.Httpd.RegisterEndpoint(&apiAttackHTTP)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	apiAttackHTTPCancel.Call = gorankusu.apiAttackHTTPCancel
	err = gorankusu.Httpd.RegisterEndpoint(&apiAttackHTTPCancel)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	apiAttackResultDelete.Call = gorankusu.apiAttackResultDelete
	err = gorankusu.Httpd.RegisterEndpoint(apiAttackResultDelete)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	apiAttackResultGet.Call = gorankusu.apiAttackResultGet
	err = gorankusu.Httpd.RegisterEndpoint(apiAttackResultGet)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiNavLinks.Call = gorankusu.apiNavLinks
	err = gorankusu.Httpd.RegisterEndpoint(apiNavLinks)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiTargetRunHTTP.Call = gorankusu.apiTargetRunHTTP
	err = gorankusu.Httpd.RegisterEndpoint(apiTargetRunHTTP)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	apiTargetRunWebSocket.Call = gorankusu.apiTargetRunWebSocket
	err = gorankusu.Httpd.RegisterEndpoint(apiTargetRunWebSocket)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiTargets.Call = gorankusu.apiTargets
	err = gorankusu.Httpd.RegisterEndpoint(apiTargets)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}

// apiEnvironmentGet get the Gorankusu environment including its state.
func (gorankusu *Gorankusu) apiEnvironmentGet(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = gorankusu.Env
	return json.Marshal(&res)
}

// apiAttackHTTP request to attack HTTP target.
//
// Request format,
//
//	POST /_gorankusu/api/attack/http
//	Content-Type: application/json
//
//	<RunRequest>
//
// Response format,
//
//	Content-Type: application/json
//
//	{"data":<RunRequest>}
//
// Response codes,
//   - 200 OK: success.
//   - 500 ERR_INTERNAL: internal server error.
func (gorankusu *Gorankusu) apiAttackHTTP(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	var (
		logp       = `apiAttackHTTP`
		runRequest = &RunRequest{}
	)

	err = json.Unmarshal(epr.RequestBody, runRequest)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	err = gorankusu.AttackHTTP(runRequest)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	var res = &libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Name = `OK_ATTACK_HTTP`
	res.Data = runRequest

	resbody, err = json.Marshal(res)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}
	return resbody, nil
}

// apiAttackHTTPCancel request to cancel the running attack on HTTP target.
//
// Request format,
//
//	DELETE /_gorankusu/api/attack/http
//
// Response format,
//
//	Content-Type: application/json
//
//	{"data":<RunRequest>}
//
// Response codes,
//   - 200 OK: success, return the RunRequest object that has been cancelled.
//   - 500 ERR_INTERNAL: internal server error.
func (gorankusu *Gorankusu) apiAttackHTTPCancel(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	var (
		logp       = `apiAttackHTTPCancel`
		runRequest *RunRequest
	)

	runRequest, err = gorankusu.AttackHTTPCancel()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	var res = &libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Name = `OK_ATTACK_HTTP_CANCEL`
	res.Message = fmt.Sprintf(`Attack on target "%s/%s" has been canceled`,
		runRequest.Target.Name, runRequest.HTTPTarget.Name)
	res.Data = runRequest

	resbody, err = json.Marshal(res)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}
	return resbody, nil
}

func (gorankusu *Gorankusu) apiAttackResultDelete(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	name := epr.HttpRequest.Form.Get(paramNameName)
	if len(name) == 0 {
		return nil, errInvalidParameter(paramNameName, name)
	}

	_, ht, result, err := gorankusu.getAttackResultByName(name)
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

func (gorankusu *Gorankusu) apiAttackResultGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	name := epr.HttpRequest.Form.Get(paramNameName)
	if len(name) == 0 {
		return nil, errInvalidParameter(paramNameName, name)
	}

	_, _, result, err := gorankusu.getAttackResultByName(name)
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

func (gorankusu *Gorankusu) apiNavLinks(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = gorankusu.navLinks
	return json.Marshal(&res)
}

func (gorankusu *Gorankusu) apiTargetRunHTTP(epr *libhttp.EndpointRequest) ([]byte, error) {
	req := &RunRequest{}
	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}

	res, err := gorankusu.RunHTTP(req)
	if err != nil {
		return nil, errInternal(err)
	}

	epres := libhttp.EndpointResponse{}
	epres.Code = http.StatusOK
	epres.Data = res

	return json.Marshal(&epres)
}

func (gorankusu *Gorankusu) apiTargetRunWebSocket(epr *libhttp.EndpointRequest) ([]byte, error) {
	req := &RunRequest{}
	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}

	origTarget := gorankusu.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	origWsTarget := origTarget.getWebSocketTargetByID(req.WebSocketTarget.ID)
	if origWsTarget == nil {
		return nil, errInvalidWebSocketTarget(req.WebSocketTarget.ID)
	}

	req = generateWebSocketTarget(gorankusu.Env, req, origTarget, origWsTarget)

	res, err := req.WebSocketTarget.Run(req)
	if err != nil {
		return nil, errInternal(err)
	}

	epres := libhttp.EndpointResponse{}
	epres.Code = http.StatusOK
	epres.Data = res

	return json.Marshal(&epres)
}

func (gorankusu *Gorankusu) apiTargets(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = gorankusu.targets
	return json.Marshal(&res)
}
