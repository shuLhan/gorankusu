// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"

	libhttp "github.com/shuLhan/share/lib/http"
)

// RunResponse contains the raw request and response when running HTTP or
// WebSocket target.
type RunResponse struct {
	ResponseStatus string
	ResponseType   string

	DumpRequest  []byte
	DumpResponse []byte
	ResponseBody []byte

	ResponseStatusCode int
}

// SetHTTPRequest dump the HTTP request including body into the DumpRequest
// field.
func (rres *RunResponse) SetHTTPRequest(req *http.Request) (err error) {
	rres.DumpRequest, err = httputil.DumpRequest(req, true)
	if err != nil {
		return fmt.Errorf(`SetHTTPRequest: %w`, err)
	}
	return nil
}

// SetHTTPResponse dump the HTTP response including body into the DumpResponse
// field.
func (rres *RunResponse) SetHTTPResponse(res *http.Response) (err error) {
	var logp = `SetHTTPResponse`

	rres.ResponseStatus = res.Status
	rres.ResponseStatusCode = res.StatusCode

	rres.DumpResponse, err = httputil.DumpResponse(res, true)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	rres.ResponseType = res.Header.Get(libhttp.HeaderContentType)

	rres.ResponseBody, err = io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}

	return nil
}
