// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
	"git.sr.ht/~shulhan/pakakeh.go/lib/test"
)

type httpRequestParams struct {
	method string
	path   string
	body   []byte
}

func TestGorankusuAPITargetRunHTTP_formInputFile(t *testing.T) {
	type testCase struct {
		tag string
	}

	var (
		tdata *test.Data
		err   error
	)
	tdata, err = test.LoadData(`testdata/target_http_run_formkindfile_test.txt`)
	if err != nil {
		t.Fatal(err)
	}

	var listCase = []testCase{{
		tag: `valid`,
	}}

	var (
		c       testCase
		runResp RunResponse
		tag     string
		exp     string
	)

	for _, c = range listCase {
		var reqparams = httpRequestParams{
			method: apiTargetRunHTTP.Method.String(),
			path:   apiTargetRunHTTP.Path,
			body:   tdata.Input[c.tag+`:http_request_body`],
		}

		_, runResp = dummyGorankusuServe(t, reqparams)

		tag = c.tag + `:RunResponse.DumpResponse`
		exp = string(tdata.Output[tag])
		test.Assert(t, tag, exp, string(runResp.DumpResponse))
	}
}

func TestGorankusuAPITargetRunHTTP_withRawBody_JSON(t *testing.T) {
	type testCase struct {
		tag string
	}

	var (
		tdata *test.Data
		err   error
	)
	tdata, err = test.LoadData(`testdata/target_http_run_withrawbody_json_test.txt`)
	if err != nil {
		t.Fatal(err)
	}

	var listCase = []testCase{{
		tag: `valid`,
	}}

	var (
		c       testCase
		runResp RunResponse
		tag     string
		exp     string
	)
	for _, c = range listCase {
		var reqparams = httpRequestParams{
			method: apiTargetRunHTTP.Method.String(),
			path:   apiTargetRunHTTP.Path,
			body:   tdata.Input[c.tag+`:http_request_body`],
		}

		_, runResp = dummyGorankusuServe(t, reqparams)

		tag = c.tag + `:RunResponse.DumpRequest`
		exp = string(tdata.Output[tag])
		test.Assert(t, tag, exp, string(runResp.DumpRequest))

		tag = c.tag + `:RunResponse.DumpResponse`
		exp = string(tdata.Output[tag])
		test.Assert(t, tag, exp, string(runResp.DumpResponse))
	}
}

func TestGorankusuAPITargetRunHTTP_withTargetHeaders(t *testing.T) {
	type testCase struct {
		tag string
	}

	var (
		tdata *test.Data
		err   error
	)
	tdata, err = test.LoadData(`testdata/apiTargetRunHTTP_withTargetHeaders_test.txt`)
	if err != nil {
		t.Fatal(err)
	}

	var listCase = []testCase{{
		tag: `global`,
	}, {
		tag: `override`,
	}}

	var (
		c       testCase
		runResp RunResponse
		buf     bytes.Buffer
		tag     string
		exp     string
	)
	for _, c = range listCase {
		var reqparams = httpRequestParams{
			method: apiTargetRunHTTP.Method.String(),
			path:   apiTargetRunHTTP.Path,
			body:   tdata.Input[c.tag+`:request_body`],
		}

		_, runResp = dummyGorankusuServe(t, reqparams)

		tag = c.tag + `:RunResponse.DumpRequest`
		exp = string(tdata.Output[tag])
		test.Assert(t, tag, exp, string(runResp.DumpRequest))

		tag = c.tag + `:RunResponse.DumpResponse`
		exp = string(tdata.Output[tag])
		test.Assert(t, tag, exp, string(runResp.DumpResponse))

		tag = c.tag + `:RunResponse.ResponseBody`
		exp = string(tdata.Output[tag])

		buf.Reset()
		err = json.Indent(&buf, runResp.ResponseBody, ``, `  `)
		if err != nil {
			t.Fatal(err)
		}
		test.Assert(t, tag, exp, buf.String())
	}
}

func dummyGorankusuServe(t *testing.T, reqparams httpRequestParams) (rawResp []byte, runResp RunResponse) {
	var body bytes.Buffer
	var recorder = httptest.NewRecorder()

	body.Write(reqparams.body)

	var httpreq = httptest.NewRequest(reqparams.method, reqparams.path, &body)

	exGorankusu.Httpd.ServeHTTP(recorder, httpreq)

	var (
		httpres = recorder.Result()
		got     []byte
		err     error
	)

	got, err = io.ReadAll(httpres.Body)
	if err != nil {
		t.Fatal(err)
	}

	body.Reset()
	err = json.Indent(&body, got, ``, `  `)
	if err != nil {
		t.Fatal(err)
	}

	rawResp = body.Bytes()

	var epres = libhttp.EndpointResponse{
		Data: &runResp,
	}

	err = json.Unmarshal(rawResp, &epres)
	if err != nil {
		t.Fatal(err)
	}

	if epres.Code != http.StatusOK {
		t.Fatalf(`dummyGorankusuServe %q: %s`, reqparams.path, got)
	}

	return rawResp, runResp
}
