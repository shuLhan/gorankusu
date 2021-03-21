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
	ID          string
	Name        string
	Opts        *AttackOptions
	Vars        KeyValue
	HttpTargets []*HttpTarget

	// HttpClient that can be used for running HttpTarget.
	HttpClient *libhttp.Client `json:"-"`
}

func (target *Target) init() (err error) {
	if len(target.Name) == 0 {
		return fmt.Errorf("Target.Name is empty")
	}

	target.ID = generateID(target.Name)

	if target.Opts == nil {
		target.Opts = &AttackOptions{}
	}

	err = target.Opts.init()
	if err != nil {
		return err
	}

	if target.Vars == nil {
		target.Vars = KeyValue{}
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
