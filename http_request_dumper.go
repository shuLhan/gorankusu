// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httputil"
)

// HTTPRequestDumper define an handler to convert [http.Request] into
// [RunResponse] DumpRequest.
type HTTPRequestDumper func(req *http.Request) ([]byte, error)

// DefaultRequestDumper define default [HTTPRequestDumper] that convert
// [http.Request] with its body to stream of bytes using
// [httputil.DumpRequest].
//
// The returned bytes have CRLF ("\r\n") replaced with single LF ("\n").
func DefaultRequestDumper() HTTPRequestDumper {
	return func(req *http.Request) (raw []byte, err error) {
		raw, err = httputil.DumpRequestOut(req, true)
		if err != nil {
			return nil, fmt.Errorf(`DefaultRequestDumper: %w`, err)
		}
		raw = bytes.ReplaceAll(raw, []byte{'\r', '\n'}, []byte{'\n'})
		return raw, nil
	}
}
