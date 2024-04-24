// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"

// HTTPParamsConverter is a handler that will be called inside the Run handler
// to convert the Params values to type that will be send as request.
type HTTPParamsConverter func(target *HTTPTarget) (any, error)

// DefaultParamsConverter define default function to convert
// [HTTPTarget.Params] to its equivalent parameters in HTTP, either as query
// in URL or as stream of bytes in body.
func DefaultParamsConverter() HTTPParamsConverter {
	return func(target *HTTPTarget) (params any, err error) {
		switch target.RequestType {
		case libhttp.RequestTypeJSON:
			params = target.Params.ToJSONObject()
		case libhttp.RequestTypeMultipartForm:
			params, err = target.Params.ToMultipartFormData()
		default:
			params = target.Params.ToURLValues()
		}
		return params, err
	}
}
