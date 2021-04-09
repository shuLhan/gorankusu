package trunks

import (
	"net/http"
	"net/url"
)

//
// KeyValue is the simplified type for getting and setting HTTP headers and
// request parameters (either in query or in the parameter body).
//
type KeyValue map[string]string

//
// ToHttpHeader convert the KeyValue to the standard http.Header.
//
func (kv KeyValue) ToHttpHeader() (headers http.Header) {
	headers = http.Header{}
	if kv == nil || len(kv) == 0 {
		return headers
	}
	for k, v := range kv {
		headers.Set(k, v)
	}
	return headers
}

//
// ToMultipartFormData convert the KeyValue into map of string and raw bytes.
//
func (kv KeyValue) ToMultipartFormData() (data map[string][]byte) {
	data = make(map[string][]byte, len(kv))
	if kv == nil || len(kv) == 0 {
		return data
	}
	for k, v := range kv {
		data[k] = []byte(v)
	}
	return data
}

//
// ToUrlValues convert the KeyValue to the standard url.Values.
//
func (kv KeyValue) ToUrlValues() (vals url.Values) {
	vals = url.Values{}
	if kv == nil || len(kv) == 0 {
		return vals
	}
	for k, v := range kv {
		vals.Set(k, v)
	}
	return vals
}
