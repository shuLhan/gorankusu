// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"sync"

	libhttp "github.com/shuLhan/share/lib/http"
	vegeta "github.com/tsenart/vegeta/v12/lib"
)

type HttpRunHandler func(target *Target, runRequest *RunRequest) ([]byte, error)
type HttpPreAttackHandler func(target *Target, ht *HttpTarget) vegeta.Targeter

type HttpTarget struct {
	// ID of target, optional.
	// If its empty, it will generated using value from Path.
	ID string

	// Name of target, optional.
	// If its empty default to Path.
	Name string

	Method      libhttp.RequestMethod
	Path        string
	RequestType libhttp.RequestType
	Headers     KeyValue
	Params      KeyValue

	Run       HttpRunHandler       `json:"-"`
	PreAttack HttpPreAttackHandler `json:"-"`

	// Status of REST.
	Status string

	// Results contains list of load testing output.
	Results []*loadTestingResult

	// AllowLoadTesting if its true, the "Run load testing" will be showed
	// on user interface.
	AllowLoadTesting bool

	mtx sync.Mutex
}

func (ht *HttpTarget) init() {
	if len(ht.ID) == 0 {
		ht.ID = generateID(ht.Path)
	}
	if len(ht.Name) == 0 {
		ht.Name = ht.Path
	}
	if ht.Headers == nil {
		ht.Headers = KeyValue{}
	}
	if ht.Params == nil {
		ht.Params = KeyValue{}
	}
}

func (ht *HttpTarget) deleteResult(result *loadTestingResult) {
	var x int
	for ; x < len(ht.Results); x++ {
		if ht.Results[x].Name == result.Name {
			break
		}
	}

	if x == len(ht.Results) {
		// Not found.
		return
	}

	copy(ht.Results[x:], ht.Results[x+1:])
	ht.Results[len(ht.Results)-1] = nil
	ht.Results = ht.Results[:len(ht.Results)-1]
}

func (ht *HttpTarget) addResult(path, name string) (err error) {
	ltr := &loadTestingResult{
		TargetID: ht.ID,
		Name:     name,
	}

	err = ltr.init(path)
	if err != nil {
		return fmt.Errorf("HttpTarget.addResult: %s %s: %w", path, name, err)
	}

	ht.Results = append(ht.Results, ltr)

	return nil
}
