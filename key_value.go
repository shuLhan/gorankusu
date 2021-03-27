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
func (kv KeyValue) ToHttpHeader() http.Header {
	if kv == nil || len(kv) == 0 {
		return nil
	}
	headers := http.Header{}
	for k, v := range kv {
		headers.Set(k, v)
	}
	return headers
}

//
// ToMultipartFormData convert the KeyValue into map of string and raw bytes.
//
func (kv KeyValue) ToMultipartFormData() (data map[string][]byte) {
	if kv == nil || len(kv) == 0 {
		return nil
	}

	data = make(map[string][]byte, len(kv))
	for k, v := range kv {
		data[k] = []byte(v)
	}
	return data
}

//
// ToUrlValues convert the KeyValue to the standard url.Values.
//
func (kv KeyValue) ToUrlValues() url.Values {
	if kv == nil || len(kv) == 0 {
		return nil
	}
	vals := url.Values{}
	for k, v := range kv {
		vals.Set(k, v)
	}
	return vals
}
