// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"

	libhttp "github.com/shuLhan/share/lib/http"
)

//
// Target contains group of HttpTarget that can be tested by Trunks.
//
type Target struct {
	ID   string
	Name string
	Hint string

	// BaseUrl contains the target address that serve the service to
	// be tested.
	// This field is required.
	BaseUrl string

	Opts             *AttackOptions
	Vars             KeyFormInput
	HttpTargets      []*HttpTarget
	WebSocketTargets []*WebSocketTarget

	// HttpClient that can be used for running HttpTarget.
	HttpClient *libhttp.Client `json:"-"`
}

func (target *Target) init() (err error) {
	if len(target.Name) == 0 {
		return fmt.Errorf("Target.Name is empty")
	}
	if len(target.BaseUrl) == 0 {
		return fmt.Errorf("Target.BaseUrl is not defined")
	}

	target.ID = generateID(target.Name)

	if target.Opts == nil {
		target.Opts = &AttackOptions{}
	}

	target.Opts.init()

	if target.Vars == nil {
		target.Vars = KeyFormInput{}
	}

	for _, ht := range target.HttpTargets {
		err = ht.init()
		if err != nil {
			return fmt.Errorf("Target.init %s: %w", target.Name, err)
		}
	}
	for _, wst := range target.WebSocketTargets {
		err = wst.init()
		if err != nil {
			return fmt.Errorf("Target.init %s: %w", target.Name, err)
		}
	}

	return nil
}

func (target *Target) getHttpTargetByID(id string) *HttpTarget {
	for _, ht := range target.HttpTargets {
		if ht.ID == id {
			return ht
		}
	}
	return nil
}

func (target *Target) getWebSocketTargetByID(id string) (wst *WebSocketTarget) {
	for _, wst = range target.WebSocketTargets {
		if wst.ID == id {
			return wst
		}
	}
	return nil
}
