// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/mlog"
	vegeta "github.com/tsenart/vegeta/v12/lib"
)

//
// HttpConvertParams is a handler that will be called inside the Run handler
// to convert the Params values to type that will be send as request.
//
type HttpConvertParams func(target *HttpTarget) (interface{}, error)

//
// HttpRunHandler define the function type that will be called when client
// send request to run the HTTP target.
//
type HttpRunHandler func(rr *RunRequest) (runres *RunResponse, err error)

//
// HttpAttackHandler define the function type that will be called when client
// send request to attack HTTP target.
//
type HttpAttackHandler func(rr *RunRequest) vegeta.Targeter

// HttpPreAttackHandler define the function type that will be called before
// the actual Attack being called.
type HttpPreAttackHandler func(rr *RunRequest)

type HttpTarget struct {
	// Name of target, required.
	Name string
	Hint string // Description about what this HTTP target is doing.

	// ID of target, optional.
	// If its empty, it will generated using value from Name.
	ID string

	Method      libhttp.RequestMethod
	Path        string
	RequestType libhttp.RequestType
	Headers     KeyFormInput
	Params      KeyFormInput

	Run           HttpRunHandler    `json:"-"`
	ConvertParams HttpConvertParams `json:"-"`

	Attack       HttpAttackHandler    `json:"-"`
	PreAttack    HttpPreAttackHandler `json:"-"`
	AttackLocker sync.Mutex           `json:"-"` // Use this inside the Attack to lock resource.

	// Results contains list of load testing output.
	Results []*AttackResult

	// AllowAttack if its true the "Attack" button will be showed on user
	// interface and client will be allowed to run load testing on this
	// HttpTarget.
	AllowAttack bool

	// IsCustomizable allow client to modify the Method, Path, and
	// RequestType.
	IsCustomizable bool
}

func (ht *HttpTarget) init() (err error) {
	if len(ht.Name) == 0 {
		return fmt.Errorf("HttpTarget.Name is empty")

	}
	if len(ht.ID) == 0 {
		ht.ID = generateID(ht.Name)
	}
	if ht.Headers == nil {
		ht.Headers = KeyFormInput{}
	}
	if ht.Params == nil {
		ht.Params = KeyFormInput{}
	}
	if len(ht.Path) == 0 {
		ht.Path = "/"
	}
	return nil
}

func (ht *HttpTarget) deleteResult(result *AttackResult) {
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

	err := os.Remove(result.fullpath)
	if err != nil {
		mlog.Errf("deleteResult: %q: %s\n", result.fullpath, err)
	}
}

func (ht *HttpTarget) addResult(dir, name string) {
	ar := &AttackResult{
		HttpTargetID: ht.ID,
		Name:         name,
		fullpath:     filepath.Join(dir, name),
	}

	ht.Results = append(ht.Results, ar)
}

func (ht *HttpTarget) getResultByName(name string) (result *AttackResult) {
	for _, result = range ht.Results {
		if result.Name == name {
			return result
		}
	}
	return nil
}
