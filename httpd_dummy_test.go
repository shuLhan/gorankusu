// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	libhttp "github.com/shuLhan/share/lib/http"
	libnet "github.com/shuLhan/share/lib/net"
)

const (
	pathRawbodyJSON = `/rawbody/json`
	pathUpload      = `/upload`
)

var dummyEndpointRawbodyJSON = libhttp.Endpoint{
	Method:       libhttp.RequestMethodPost,
	Path:         pathRawbodyJSON,
	RequestType:  libhttp.RequestTypeJSON,
	ResponseType: libhttp.ResponseTypeJSON,
}

var dummyEndpointUpload = libhttp.Endpoint{
	Method:       libhttp.RequestMethodPost,
	Path:         pathUpload,
	RequestType:  libhttp.RequestTypeMultipartForm,
	ResponseType: libhttp.ResponseTypeJSON,
}

// httpdDummy dummy HTTP server as target for testing.
type httpdDummy struct {
	*libhttp.Server
}

// newHttpdDummy create and run dummy HTTP server.
func newHttpdDummy() (dum *httpdDummy, err error) {
	var logp = `newHttpdDummy`

	var serverOpts = libhttp.ServerOptions{
		Address: `127.0.0.1:22796`,
	}

	dum = &httpdDummy{}

	dum.Server, err = libhttp.NewServer(&serverOpts)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	err = dum.registerEndpoints()
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	go func() {
		var errStart = dum.Server.Start()
		if errStart != nil {
			log.Fatalf(`%s: %s`, logp, errStart)
		}
	}()

	err = libnet.WaitAlive(`tcp`, serverOpts.Address, time.Second)
	if err != nil {
		return nil, fmt.Errorf(`%s: %w`, logp, err)
	}

	return dum, nil
}

func (dum *httpdDummy) registerEndpoints() (err error) {
	var logp = `registerEndpoints`

	dummyEndpointRawbodyJSON.Call = dum.rawbodyJSON

	err = dum.Server.RegisterEndpoint(&dummyEndpointRawbodyJSON)
	if err != nil {
		return fmt.Errorf(`%s %s: %w`, logp, dummyEndpointUpload.Path, err)
	}

	dummyEndpointUpload.Call = dum.upload

	err = dum.Server.RegisterEndpoint(&dummyEndpointUpload)
	if err != nil {
		return fmt.Errorf(`%s %s: %w`, logp, dummyEndpointUpload.Path, err)
	}

	return nil
}

func (dum *httpdDummy) rawbodyJSON(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	var (
		logp = `rawbodyJSON`
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

// upload handle HTTP POST with request type "multipart/form-data".
// It will response by echoing back the [HttpRequest.MultipartForm] as JSON.
func (dum *httpdDummy) upload(epr *libhttp.EndpointRequest) (resbody []byte, err error) {
	var res = libhttp.EndpointResponse{}

	res.Code = http.StatusOK
	res.Data = epr.HttpRequest.MultipartForm.Value

	resbody, err = json.MarshalIndent(res, ``, `  `)
	if err != nil {
		return nil, err
	}

	return resbody, nil
}
