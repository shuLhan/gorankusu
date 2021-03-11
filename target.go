// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"

	libhttp "github.com/shuLhan/share/lib/http"
)

//
// Target contains group of HTTP and/or WebSocket endpoints that can be tested
// by Trunks.
//
type Target struct {
	ID          string
	Name        string
	AttackOpts  *AttackOptions
	Vars        map[string]string
	HttpTargets []*HttpTarget

	// HttpClient that can be used for running HttpTarget.
	HttpClient *libhttp.Client `json:"-"`
}

func (target *Target) init() (err error) {
	if len(target.Name) == 0 {
		return fmt.Errorf("Target.Name is empty")
	}

	target.ID = generateID(target.Name)

	if target.AttackOpts == nil {
		target.AttackOpts = &AttackOptions{}
	}

	err = target.AttackOpts.init()
	if err != nil {
		return err
	}

	if target.Vars == nil {
		target.Vars = make(map[string]string, 0)
	}

	for _, ht := range target.HttpTargets {
		ht.init()
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
