// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"fmt"

	libhttp "github.com/shuLhan/share/lib/http"
)

// Target contains group of HTTPTarget that can be tested by Trunks.
type Target struct {
	// HTTPClient that can be used for running HTTPTarget.
	HTTPClient *libhttp.Client `json:"-"`

	Opts *AttackOptions
	Vars KeyFormInput

	ID   string
	Name string

	// BaseURL contains the target address that serve the service to
	// be tested.
	// This field is required.
	BaseURL string

	Hint string

	HTTPTargets      []*HTTPTarget
	WebSocketTargets []*WebSocketTarget
}

func (target *Target) init() (err error) {
	if len(target.Name) == 0 {
		return fmt.Errorf("Target.Name is empty")
	}
	if len(target.BaseURL) == 0 {
		return fmt.Errorf("Target.BaseURL is not defined")
	}

	target.ID = generateID(target.Name)

	if target.Opts == nil {
		target.Opts = &AttackOptions{}
	}

	target.Opts.init()

	if target.Vars == nil {
		target.Vars = KeyFormInput{}
	}

	var ht *HTTPTarget
	for _, ht = range target.HTTPTargets {
		err = ht.init()
		if err != nil {
			return fmt.Errorf("Target.init %s: %w", target.Name, err)
		}
	}

	var wst *WebSocketTarget
	for _, wst = range target.WebSocketTargets {
		err = wst.init()
		if err != nil {
			return fmt.Errorf("Target.init %s: %w", target.Name, err)
		}
	}

	return nil
}

func (target *Target) getHTTPTarget(id string) *HTTPTarget {
	for _, ht := range target.HTTPTargets {
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
