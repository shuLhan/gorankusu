// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	libhttp "github.com/shuLhan/share/lib/http"
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
			httpcOpts = &libhttp.ClientOptions{
				ServerUrl:     rr.Target.BaseURL,
				AllowInsecure: true,
			}
			httpc  = libhttp.NewClient(httpcOpts)
			params any
		)

		if !rr.HTTPTarget.WithRawBody {
			rr.HTTPTarget.paramsToPath()

			params, err = rr.HTTPTarget.ParamsConverter(&rr.HTTPTarget)
			if err != nil {
				return nil, fmt.Errorf(`%s: %w`, logp, err)
			}
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

		var httpRequest *http.Request

		httpRequest, err = httpc.GenerateHttpRequest(
			rr.HTTPTarget.Method,
			rr.HTTPTarget.Path,
			rr.HTTPTarget.RequestType,
			headers,
			params,
		)
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

		var httpResponse *http.Response

		httpResponse, _, err = httpc.Do(httpRequest)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		err = res.SetHTTPResponse(rr.HTTPTarget.ResponseDumper, httpResponse)
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		return res, nil
	}
}
