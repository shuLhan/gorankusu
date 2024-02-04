// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httputil"
)

// HTTPResponseDumper define an handler to convert [http.Response] into
// [RunResponse] DumpResponse.
type HTTPResponseDumper func(resp *http.Response) ([]byte, error)

// DumpHTTPResponse define default [HTTPResponseDumper] that convert
// [http.Response] with its body to stream of bytes using
// [httputil.DumpResponse].
//
// The returned dump have CRLF ("\r\n") replaced with single LF ("\n").
func DumpHTTPResponse(resp *http.Response) (raw []byte, err error) {
	raw, err = httputil.DumpResponse(resp, true)
	if err != nil {
		return nil, fmt.Errorf(`DumpHTTPResponse: %w`, err)
	}
	raw = bytes.ReplaceAll(raw, []byte{'\r', '\n'}, []byte{'\n'})
	return raw, nil
}
