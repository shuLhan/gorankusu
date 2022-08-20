// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"net/http"
	"net/url"

	"github.com/shuLhan/share/lib/math/big"
)

// KeyFormInput is the simplified type for getting and setting HTTP headers
// and request parameters (either in query or in the parameter body).
type KeyFormInput map[string]FormInput

// ToHttpHeader convert the KeyFormInputs to the standard http.Header.
func (kfi KeyFormInput) ToHttpHeader() (headers http.Header) {
	headers = http.Header{}
	if kfi == nil || len(kfi) == 0 {
		return headers
	}
	for k, fi := range kfi {
		headers.Set(k, fi.Value)
	}
	return headers
}

// ToJsonObject convert the KeyFormInput into JSON object.
func (kfi KeyFormInput) ToJsonObject() (data map[string]interface{}) {
	data = make(map[string]interface{}, len(kfi))
	for k, fi := range kfi {
		switch fi.Kind {
		case FormInputKindNumber:
			data[k], _ = big.NewRat(fi.Value).Float64()
		default:
			data[k] = fi.Value
		}
	}
	return data
}

// ToMultipartFormData convert the KeyFormInput into map of string and raw
// bytes.
func (kfi KeyFormInput) ToMultipartFormData() (data map[string][]byte) {
	data = make(map[string][]byte, len(kfi))
	if kfi == nil || len(kfi) == 0 {
		return data
	}
	for k, fi := range kfi {
		data[k] = []byte(fi.Value)
	}
	return data
}

// ToUrlValues convert the KeyFormInput to the standard url.Values.
func (kfi KeyFormInput) ToUrlValues() (vals url.Values) {
	vals = url.Values{}
	if kfi == nil || len(kfi) == 0 {
		return vals
	}
	for k, fi := range kfi {
		vals.Set(k, fi.Value)
	}
	return vals
}
