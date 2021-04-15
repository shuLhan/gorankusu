// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httputil"

	libhttp "github.com/shuLhan/share/lib/http"
)

//
// RunResponse contains the raw request and response when running HTTP or
// WebSocket target.
//
type RunResponse struct {
	DumpRequest  []byte
	DumpResponse []byte
	ResponseType string
	ResponseBody []byte
}

//
// SetHttpResponse dump the HTTP request including body into the DumpRequest
// field.
//
func (rres *RunResponse) SetHttpRequest(req *http.Request) (err error) {
	rres.DumpRequest, err = httputil.DumpRequest(req, true)
	if err != nil {
		return fmt.Errorf("SetHttpRequest: %w", err)
	}
	return nil
}

//
// SetHttpResponse dump the HTTP response including body into the DumpResponse
// field.
//
func (rres *RunResponse) SetHttpResponse(res *http.Response) (err error) {
	logp := "SetHttpResponse"

	rres.DumpResponse, err = httputil.DumpResponse(res, true)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	rres.ResponseType = res.Header.Get(libhttp.HeaderContentType)

	rres.ResponseBody, err = ioutil.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}
