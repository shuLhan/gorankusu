// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/shuLhan/share/lib/math/big"
)

// KeyFormInput is the simplified type for getting and setting HTTP headers
// and request parameters (either in query or in the parameter body).
type KeyFormInput map[string]FormInput

// ToHTTPHeader convert the KeyFormInputs to the standard http.Header.
func (kfi KeyFormInput) ToHTTPHeader() (headers http.Header) {
	headers = http.Header{}
	if len(kfi) == 0 {
		return headers
	}
	for k, fi := range kfi {
		headers.Set(k, fi.Value)
	}
	return headers
}

// ToJSONObject convert the KeyFormInput into JSON object.
// FormInput with Kind is FormInputKindBoolean will be converted to true if
// the Value is either "true", "yes", or "1".
func (kfi KeyFormInput) ToJSONObject() (data map[string]interface{}) {
	var (
		k    string
		fi   FormInput
		vstr string
	)

	data = make(map[string]interface{}, len(kfi))
	for k, fi = range kfi {
		switch fi.Kind {
		case FormInputKindBoolean:
			vstr = strings.ToLower(fi.Value)
			if vstr == `true` || vstr == `yes` || vstr == `1` {
				data[k] = true
			} else {
				data[k] = false
			}
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
	if len(kfi) == 0 {
		return data
	}
	for k, fi := range kfi {
		data[k] = []byte(fi.Value)
	}
	return data
}

// ToURLValues convert the KeyFormInput to the standard url.Values.
func (kfi KeyFormInput) ToURLValues() (vals url.Values) {
	vals = url.Values{}
	if len(kfi) == 0 {
		return vals
	}
	for k, fi := range kfi {
		vals.Set(k, fi.Value)
	}
	return vals
}
