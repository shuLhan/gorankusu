// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import "encoding/json"

//
// request represent generic request.
//
type request struct {
	Env             *Environment
	Target          *HttpTarget
	WebSocketTarget *WebSocketTarget
	Result          *loadTestingResult
}

func (req *request) unpack(b []byte) error {
	return json.Unmarshal(b, req)
}
