// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"fmt"
	"io"
	"net/http"

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
func (rres *RunResponse) SetHTTPRequest(dumper HTTPRequestDumper, req *http.Request) (err error) {
	rres.DumpRequest, err = dumper(req)
	if err != nil {
		return fmt.Errorf(`SetHTTPRequest: %w`, err)
	}
	return nil
}

// SetHTTPResponse dump the HTTP response including body into the DumpResponse
// field.
func (rres *RunResponse) SetHTTPResponse(dumper HTTPResponseDumper, res *http.Response) (err error) {
	var logp = `SetHTTPResponse`

	rres.ResponseStatus = res.Status
	rres.ResponseStatusCode = res.StatusCode

	rres.DumpResponse, err = dumper(res)
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
