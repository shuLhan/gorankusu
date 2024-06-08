// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
)

// HTTPRunHandler define the function type that will be called when client
// send request to run the HTTP target.
type HTTPRunHandler func(rr *RunRequest) (runres *RunResponse, err error)

// DefaultHTTPRun default [HTTPTarget.Run] handler that generate
// [http.Request], send it to the target, and store and dump them into
// [RunResponse].
func DefaultHTTPRun() HTTPRunHandler {
	return func(rr *RunRequest) (res *RunResponse, err error) {
		var (
			logp      = `DefaultHTTPRun`
			httpcOpts = libhttp.ClientOptions{
				ServerURL:     rr.Target.BaseURL,
				AllowInsecure: true,
			}
			httpc  = libhttp.NewClient(httpcOpts)
			params any
		)

		rr.HTTPTarget.paramsToPath()

		params, err = rr.HTTPTarget.ParamsConverter(&rr.HTTPTarget)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		var (
			headers = http.Header{}
			key     string
			fi      FormInput
		)
		for key, fi = range rr.Target.Headers {
			if len(fi.Value) != 0 {
				headers.Set(key, fi.Value)
			}
		}
		for key, fi = range rr.HTTPTarget.Headers {
			if len(fi.Value) != 0 {
				headers.Set(key, fi.Value)
			}
		}

		var (
			clientReq = libhttp.ClientRequest{
				Method: rr.HTTPTarget.Method,
				Path:   rr.HTTPTarget.Path,
				Type:   rr.HTTPTarget.RequestType,
				Header: headers,
				Params: params,
			}
			httpRequest *http.Request
		)

		httpRequest, err = httpc.GenerateHTTPRequest(clientReq)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		if rr.HTTPTarget.WithRawBody {
			httpRequest.Body = io.NopCloser(bytes.NewReader(rr.HTTPTarget.RawBody))
			httpRequest.ContentLength = int64(len(rr.HTTPTarget.RawBody))
		}

		res = &RunResponse{}

		err = res.SetHTTPRequest(rr.HTTPTarget.RequestDumper, httpRequest)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		var clientRes *libhttp.ClientResponse

		clientRes, err = httpc.Do(httpRequest)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		err = res.SetHTTPResponse(rr.HTTPTarget.ResponseDumper, clientRes.HTTPResponse)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		return res, nil
	}
}
