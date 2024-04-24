// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"fmt"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
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

// ToMultipartFormData convert the KeyFormInput into [*multipart.Form].
func (kfi KeyFormInput) ToMultipartFormData() (data *multipart.Form, err error) {
	var logp = `ToMultipartFormData`

	data = &multipart.Form{
		Value: map[string][]string{},
		File:  map[string][]*multipart.FileHeader{},
	}
	if len(kfi) == 0 {
		return data, nil
	}

	var (
		k         string
		fi        FormInput
		listValue []string
	)
	for k, fi = range kfi {
		if fi.Kind != FormInputKindFile {
			listValue = data.Value[k]
			listValue = append(listValue, fi.Value)
			data.Value[k] = listValue
			continue
		}

		// Process form with type File.

		var (
			filename  string
			fieldname string
		)

		if len(fi.Filename) != 0 {
			filename = fi.Filename
		} else {
			filename = k
		}

		if len(fi.Filetype) != 0 {
			fieldname = fi.FormDataName(FormDataFiletype)
			data.Value[fieldname] = []string{fi.Filetype}
		}

		fieldname = fi.FormDataName(FormDataFilesize)
		data.Value[fieldname] = []string{strconv.FormatInt(fi.Filesize, 10)}

		fieldname = fi.FormDataName(FormDataFilemodms)
		data.Value[fieldname] = []string{strconv.FormatInt(fi.Filemodms, 10)}

		var fh *multipart.FileHeader

		fh, err = libhttp.CreateMultipartFileHeader(filename, []byte(fi.Value))
		if err != nil {
			return nil, fmt.Errorf(`%s: %w`, logp, err)
		}

		var listFH = data.File[k]
		listFH = append(listFH, fh)
		data.File[k] = listFH
	}
	return data, nil
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
