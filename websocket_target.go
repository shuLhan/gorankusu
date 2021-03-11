// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"strings"

	"github.com/shuLhan/share/lib/ascii"
)

type websocketRunHandler func(wstarget *WebSocketTarget, req *request) ([]byte, error)

type WebSocketTarget struct {
	ID     string
	Name   string
	Status string
	Params map[string]string

	// connectPath define the path on server where connection should be
	// open, for example "/" or "/ws".
	connectPath string
	reqMethod   string
	reqTarget   string

	// runHandler define a function that will be called to run the test.
	runHandler websocketRunHandler
}

func (wstarget *WebSocketTarget) init() {
	if len(wstarget.ID) == 0 {
		name := []byte(strings.ToLower(wstarget.Name))
		for x := 0; x < len(name); x++ {
			if !ascii.IsAlnum(name[x]) {
				name[x] = '_'
			}
		}
		wstarget.ID = string(name)
	}
}
