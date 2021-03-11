package trunks

import (
	"net/http"
	"net/url"
)

type KeyValue map[string]string

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
