// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"encoding/json"
	"fmt"
	"mime/multipart"

	libhttp "git.sr.ht/~shulhan/pakakeh.go/lib/http"
	vegeta "github.com/tsenart/vegeta/v12/lib"
)

// HTTPAttackHandler define the function type that will be called when client
// send request to attack HTTP target.
type HTTPAttackHandler func(rr *RunRequest) vegeta.Targeter

// DefaultHTTPAttack define the default value for [HTTPTarget.Attack] handler
// that return [vegeta.Targeter].
func DefaultHTTPAttack() HTTPAttackHandler {
	return func(rr *RunRequest) vegeta.Targeter {
		var err error

		rr.HTTPTarget.Lock()
		defer rr.HTTPTarget.Unlock()

		rr.HTTPTarget.paramsToPath()

		var vegetaTarget = vegeta.Target{
			Method: string(rr.HTTPTarget.Method),
			URL:    fmt.Sprintf(`%s%s`, rr.Target.BaseURL, rr.HTTPTarget.Path),
			Header: rr.HTTPTarget.Headers.ToHTTPHeader(),
		}

		var contentType = rr.HTTPTarget.RequestType.String()
		if len(contentType) != 0 {
			vegetaTarget.Header.Set(libhttp.HeaderContentType, contentType)
		}

		if rr.HTTPTarget.WithRawBody {
			vegetaTarget.Body = rr.HTTPTarget.RawBody
		} else {
			switch rr.HTTPTarget.RequestType {
			case libhttp.RequestTypeQuery:
				var q = rr.HTTPTarget.Params.ToURLValues().Encode()
				if len(q) > 0 {
					vegetaTarget.URL += `?` + q
				}

			case libhttp.RequestTypeForm:
				var form = rr.HTTPTarget.Params.ToURLValues().Encode()
				vegetaTarget.Body = []byte(form)

			case libhttp.RequestTypeJSON:
				var mapStringAny = rr.HTTPTarget.Params.ToJSONObject()

				vegetaTarget.Body, err = json.Marshal(mapStringAny)

			case libhttp.RequestTypeMultipartForm:
				var (
					params *multipart.Form
					body   string
				)

				params, err = rr.HTTPTarget.Params.ToMultipartFormData()
				if err == nil {
					contentType, body, err = libhttp.GenerateFormData(params)
					if err == nil {
						vegetaTarget.Body = []byte(body)
						vegetaTarget.Header.Set(libhttp.HeaderContentType, contentType)
					}
				}
			}
		}

		return func(tgt *vegeta.Target) error {
			if err != nil {
				return fmt.Errorf(`DefaultHTTPAttack: %w`, err)
			}
			*tgt = vegetaTarget
			return nil
		}
	}
}
