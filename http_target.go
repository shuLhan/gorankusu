// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/mlog"
	libpath "github.com/shuLhan/share/lib/path"
	vegeta "github.com/tsenart/vegeta/v12/lib"
)

// HTTPConvertParams is a handler that will be called inside the Run handler
// to convert the Params values to type that will be send as request.
type HTTPConvertParams func(target *HTTPTarget) (interface{}, error)

// HTTPRunHandler define the function type that will be called when client
// send request to run the HTTP target.
type HTTPRunHandler func(rr *RunRequest) (runres *RunResponse, err error)

// HTTPAttackHandler define the function type that will be called when client
// send request to attack HTTP target.
type HTTPAttackHandler func(rr *RunRequest) vegeta.Targeter

// HTTPPreAttackHandler define the function type that will be called before
// the actual Attack being called.
type HTTPPreAttackHandler func(rr *RunRequest)

// HTTPTarget define the HTTP endpoint that can be attached to Trunks.
type HTTPTarget struct {
	Params        KeyFormInput
	ConvertParams HTTPConvertParams `json:"-"`

	Headers KeyFormInput

	Run       HTTPRunHandler       `json:"-"`
	PreAttack HTTPPreAttackHandler `json:"-"`
	Attack    HTTPAttackHandler    `json:"-"`

	// RequestDumper define the handler to store [http.Request] after
	// Run into [RunRequest] DumpRequest.
	// Default to [DumpHTTPRequest] if its nil.
	RequestDumper HTTPRequestDumper `json:"-"`

	// ResponseDumper define the handler to store [http.Response] after
	// Run into [RunRequest] DumpResponse.
	// Default to [DumpHTTPResponse] if its nil.
	ResponseDumper HTTPResponseDumper `json:"-"`

	// ID of target, optional.
	// If its empty, it will generated using value from Name.
	ID string

	Name string // Name of target, required.
	Hint string // Description about what this HTTP target is doing.
	Path string

	Results     []*AttackResult // Results contains list of load testing output.
	RequestType libhttp.RequestType
	Method      libhttp.RequestMethod

	sync.Mutex `json:"-"` // Use this inside the Attack to lock resource.

	// AllowAttack if its true the "Attack" button will be showed on user
	// interface and client will be allowed to run load testing on this
	// HTTPTarget.
	AllowAttack bool

	// IsCustomizable allow client to modify the Method, Path, and
	// RequestType.
	IsCustomizable bool
}

// clone the source HTTPTarget.
// This method is provided to prevent the sync.Mutex being copied.
func (ht *HTTPTarget) clone(src *HTTPTarget) {
	ht.Params = src.Params
	ht.ConvertParams = src.ConvertParams
	ht.Headers = src.Headers
	ht.Run = src.Run
	ht.PreAttack = src.PreAttack
	ht.Attack = src.Attack
	ht.RequestDumper = src.RequestDumper
	ht.ResponseDumper = src.ResponseDumper
	ht.ID = src.ID
	ht.Name = src.Name
	ht.Hint = src.Hint
	ht.Path = src.Path
	ht.Results = src.Results
	ht.RequestType = src.RequestType
	ht.Method = src.Method
	ht.AllowAttack = src.AllowAttack
	ht.IsCustomizable = src.IsCustomizable
}

func (ht *HTTPTarget) init() (err error) {
	if len(ht.Name) == 0 {
		return fmt.Errorf(`HTTPTarget.Name is empty`)
	}
	if len(ht.ID) == 0 {
		ht.ID = generateID(ht.Name)
	}
	if ht.Headers == nil {
		ht.Headers = KeyFormInput{}
	}
	if ht.Params == nil {
		ht.Params = KeyFormInput{}
	} else {
		var (
			key       string
			formInput FormInput
		)
		for key, formInput = range ht.Params {
			formInput.init()
			ht.Params[key] = formInput
		}
	}
	if len(ht.Path) == 0 {
		ht.Path = "/"
	}
	if ht.RequestDumper == nil {
		ht.RequestDumper = DumpHTTPRequest
	}
	if ht.ResponseDumper == nil {
		ht.ResponseDumper = DumpHTTPResponse
	}
	return nil
}

func (ht *HTTPTarget) deleteResult(result *AttackResult) {
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
		mlog.Errf(`deleteResult: %q: %s`, result.fullpath, err)
	}
}

func (ht *HTTPTarget) addResult(dir, name string) {
	ar := &AttackResult{
		HTTPTargetID: ht.ID,
		Name:         name,
		fullpath:     filepath.Join(dir, name),
	}

	ht.Results = append(ht.Results, ar)
}

func (ht *HTTPTarget) getResultByName(name string) (result *AttackResult) {
	for _, result = range ht.Results {
		if result.Name == name {
			return result
		}
	}
	return nil
}

// paramsToPath fill the key in path with value from parameter.
// The key is sub-path that start with ":", for example "/:name", the key is
// name.
// The key in Params will be deleted if its exists in Path.
func (ht *HTTPTarget) paramsToPath() {
	var (
		logp = `paramsToPath`

		rute *libpath.Route
		err  error
	)

	rute, err = libpath.NewRoute(ht.Path)
	if err != nil {
		log.Printf(`%s %q: %s`, logp, ht.ID, err)
		return
	}

	var (
		fin FormInput
		key string
		ok  bool
	)

	for _, key = range rute.Keys() {
		fin, ok = ht.Params[key]
		if !ok {
			continue
		}
		ok = rute.Set(key, fin.Value)
		if ok {
			delete(ht.Params, key)
		}
	}

	ht.Path = rute.String()
}

// refCopy copy methods and handlers from orig to ht.
func (ht *HTTPTarget) refCopy(orig *HTTPTarget) {
	ht.ConvertParams = orig.ConvertParams
	ht.RequestDumper = orig.RequestDumper
	ht.ResponseDumper = orig.ResponseDumper

	var (
		key    string
		fin    FormInput
		orgfin FormInput
		ok     bool
	)
	for key, fin = range ht.Params {
		if fin.Kind == FormInputKindFile {
			orgfin, ok = orig.Params[key]
			if ok {
				fin.FormDataName = orgfin.FormDataName
				ht.Params[key] = fin
			}
		}
	}
}

func (ht *HTTPTarget) sortResults() {
	sort.Slice(ht.Results, func(x, y int) bool {
		return ht.Results[x].Name > ht.Results[y].Name
	})
}

func (ht *HTTPTarget) String() string {
	var sb strings.Builder

	fmt.Fprintf(&sb, `ID:%s Name:%s Hint:%s Path:%s `+
		`Params:%v ConvertParams:%v Headers:%v `+
		`AllowAttack:%t IsCustomizable:%t`,
		ht.ID, ht.Name, ht.Hint, ht.Path,
		ht.Params, ht.ConvertParams, ht.Headers,
		ht.AllowAttack, ht.IsCustomizable)

	return sb.String()
}
