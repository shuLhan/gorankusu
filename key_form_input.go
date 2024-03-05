// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"git.sr.ht/~shulhan/pakakeh.go/lib/math/big"
)

// List of additional parameters to be generated and send if the [FormInput]
// Kind is [FormInputKindFile].
//
// Caller can changes the name by using [FormInput] FormDataName.
const (
	FormDataFilecontent = `filecontent`
	FormDataFilemodms   = `filemodms`
	FormDataFilename    = `filename`
	FormDataFilesize    = `filesize`
	FormDataFiletype    = `filetype`
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
		if fi.Kind == FormInputKindFile {
			var name string

			if len(fi.Filename) != 0 {
				name = fi.FormDataName(FormDataFilename)
				data[name] = []byte(fi.Filename)
			}
			if len(fi.Filetype) != 0 {
				name = fi.FormDataName(FormDataFiletype)
				data[name] = []byte(fi.Filetype)
			}
			name = fi.FormDataName(FormDataFilesize)
			data[name] = []byte(strconv.FormatInt(fi.Filesize, 10))

			name = fi.FormDataName(FormDataFilemodms)
			data[name] = []byte(strconv.FormatInt(fi.Filemodms, 10))

			name = fi.FormDataName(FormDataFilecontent)
			data[name] = []byte(fi.Value)
		} else {
			data[k] = []byte(fi.Value)
		}
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
