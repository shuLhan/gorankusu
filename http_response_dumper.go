// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httputil"
)

// HTTPResponseDumper define an handler to convert [http.Response] into
// [RunResponse] DumpResponse.
type HTTPResponseDumper func(resp *http.Response) ([]byte, error)

// DefaultResponseDumper define default [HTTPResponseDumper] that convert
// [http.Response] with its body to stream of bytes using
// [httputil.DumpResponse].
//
// The returned bytes have CRLF ("\r\n") replaced with single LF ("\n").
func DefaultResponseDumper() HTTPResponseDumper {
	return func(resp *http.Response) (raw []byte, err error) {
		raw, err = httputil.DumpResponse(resp, true)
		if err != nil {
			return nil, fmt.Errorf(`DefaultResponseDumper: %w`, err)
		}
		raw = bytes.ReplaceAll(raw, []byte{'\r', '\n'}, []byte{'\n'})
		return raw, nil
	}
}
