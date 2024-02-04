// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"encoding/json"
	"fmt"
	"net/http"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/memfs"
)

// List of HTTP APIs.
const (
	pathAPIAttackHTTP   = `/_trunks/api/attack/http`
	pathAPIAttackResult = `/_trunks/api/attack/result`

	pathAPIEnvironment = `/_trunks/api/environment`
	pathAPINavlinks    = `/_trunks/api/navlinks`

	pathAPITargetRunHTTP      = `/_trunks/api/target/run/http`
	pathAPITargetRunWebSocket = `/_trunks/api/target/run/websocket`
	pathAPITargets            = `/_trunks/api/targets`
)

// List of HTTP APIs provided by Trunks HTTP server.
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

func (trunks *Trunks) initHTTPServer(isDevelopment bool) (err error) {
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
		Address: trunks.Env.ListenAddress,
	}

	trunks.Httpd, err = libhttp.NewServer(httpdOpts)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiEnvironmentGet.Call = trunks.apiEnvironmentGet
	err = trunks.Httpd.RegisterEndpoint(apiEnvironmentGet)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiAttackHTTP.Call = trunks.apiAttackHTTP
	err = trunks.Httpd.RegisterEndpoint(&apiAttackHTTP)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	apiAttackHTTPCancel.Call = trunks.apiAttackHTTPCancel
	err = trunks.Httpd.RegisterEndpoint(&apiAttackHTTPCancel)
	if err != nil {
		return fmt.Errorf(`%s: %w`, logp, err)
	}

	apiAttackResultDelete.Call = trunks.apiAttackResultDelete
	err = trunks.Httpd.RegisterEndpoint(apiAttackResultDelete)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	apiAttackResultGet.Call = trunks.apiAttackResultGet
	err = trunks.Httpd.RegisterEndpoint(apiAttackResultGet)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiNavLinks.Call = trunks.apiNavLinks
	err = trunks.Httpd.RegisterEndpoint(apiNavLinks)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiTargetRunHTTP.Call = trunks.apiTargetRunHTTP
	err = trunks.Httpd.RegisterEndpoint(apiTargetRunHTTP)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	apiTargetRunWebSocket.Call = trunks.apiTargetRunWebSocket
	err = trunks.Httpd.RegisterEndpoint(apiTargetRunWebSocket)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiTargets.Call = trunks.apiTargets
	err = trunks.Httpd.RegisterEndpoint(apiTargets)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}

// apiEnvironmentGet get the Trunks environment including its state.
func (trunks *Trunks) apiEnvironmentGet(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.Env
	return json.Marshal(&res)
}

// apiAttackHTTP request to attack HTTP target.
//
// Request format,
//
//	POST /_trunks/api/attack/http
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
func (trunks *Trunks) apiAttackHTTP(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	var (
		logp       = `apiAttackHTTP`
		runRequest = &RunRequest{}
	)

	err = json.Unmarshal(epr.RequestBody, runRequest)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	err = trunks.AttackHTTP(runRequest)
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
//	DELETE /_trunks/api/attack/http
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
func (trunks *Trunks) apiAttackHTTPCancel(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	var (
		logp       = `apiAttackHTTPCancel`
		runRequest *RunRequest
	)

	runRequest, err = trunks.AttackHTTPCancel()
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

func (trunks *Trunks) apiAttackResultDelete(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
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

func (trunks *Trunks) apiAttackResultGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
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

func (trunks *Trunks) apiNavLinks(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.navLinks
	return json.Marshal(&res)
}

func (trunks *Trunks) apiTargetRunHTTP(epr *libhttp.EndpointRequest) ([]byte, error) {
	req := &RunRequest{}
	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}

	res, err := trunks.RunHTTP(req)
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

	origTarget := trunks.getTargetByID(req.Target.ID)
	if origTarget == nil {
		return nil, errInvalidTarget(req.Target.ID)
	}

	origWsTarget := origTarget.getWebSocketTargetByID(req.WebSocketTarget.ID)
	if origWsTarget == nil {
		return nil, errInvalidWebSocketTarget(req.WebSocketTarget.ID)
	}

	req = generateWebSocketTarget(trunks.Env, req, origTarget, origWsTarget)

	res, err := req.WebSocketTarget.Run(req)
	if err != nil {
		return nil, errInternal(err)
	}

	epres := libhttp.EndpointResponse{}
	epres.Code = http.StatusOK
	epres.Data = res

	return json.Marshal(&epres)
}

func (trunks *Trunks) apiTargets(_ *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.targets
	return json.Marshal(&res)
}
