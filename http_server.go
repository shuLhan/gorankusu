// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"encoding/json"
	"fmt"
	"net/http"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/memfs"
)

// List of HTTP APIs provided by Trunks HTTP server.
var (
	apiEnvironmentGet = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         "/_trunks/api/environment",
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiTargetAttackResultDelete = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodDelete,
		Path:         "/_trunks/api/target/attack/result",
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}
	apiTargetAttackResultGet = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         "/_trunks/api/target/attack/result",
		RequestType:  libhttp.RequestTypeQuery,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiTargetRunHttp = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         "/_trunks/api/target/run/http",
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}
	apiTargetRunWebSocket = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodPost,
		Path:         "/_trunks/api/target/run/websocket",
		RequestType:  libhttp.RequestTypeJSON,
		ResponseType: libhttp.ResponseTypeJSON,
	}

	apiTargets = &libhttp.Endpoint{
		Method:       libhttp.RequestMethodGet,
		Path:         "/_trunks/api/targets",
		RequestType:  libhttp.RequestTypeNone,
		ResponseType: libhttp.ResponseTypeJSON,
	}
)

func (trunks *Trunks) initHttpServer(isDevelopment bool) (err error) {
	logp := "initHttpServer"

	httpdOpts := &libhttp.ServerOptions{
		Options: memfs.Options{
			Root: "_www",
			Includes: []string{
				`.*\.(js|html|ico|png)$`,
			},
			Development: isDevelopment,
		},
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

	apiTargetAttackResultDelete.Call = trunks.apiTargetAttackResultDelete
	err = trunks.Httpd.RegisterEndpoint(apiTargetAttackResultDelete)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	apiTargetAttackResultGet.Call = trunks.apiTargetAttackResultGet
	err = trunks.Httpd.RegisterEndpoint(apiTargetAttackResultGet)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	apiTargetRunHttp.Call = trunks.apiTargetRunHttp
	err = trunks.Httpd.RegisterEndpoint(apiTargetRunHttp)
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

//
// apiEnvironmentGet get the Trunks environment including its state.
//
func (trunks *Trunks) apiEnvironmentGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.Env
	return json.Marshal(&res)
}

func (trunks *Trunks) apiTargetAttackResultDelete(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
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

func (trunks *Trunks) apiTargetAttackResultGet(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
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

func (trunks *Trunks) apiTargetRunHttp(epr *libhttp.EndpointRequest) ([]byte, error) {
	req := &RunRequest{}
	err := json.Unmarshal(epr.RequestBody, req)
	if err != nil {
		return nil, errInternal(err)
	}

	res, err := trunks.RunHttp(req)
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

func (trunks *Trunks) apiTargets(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	res := libhttp.EndpointResponse{}
	res.Code = http.StatusOK
	res.Data = trunks.targets
	return json.Marshal(&res)
}
