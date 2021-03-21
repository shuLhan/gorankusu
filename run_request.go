// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"sync"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"
)

type RunRequest struct {
	Locker     sync.Mutex
	Target     *Target
	HttpTarget *HttpTarget
	result     *AttackResult
}

func (rr *RunRequest) String() string {
	return fmt.Sprintf("Target:%v HttpTarget:%v\n", rr.Target, rr.HttpTarget)
}

//
// merge the request parameter into original target and HTTP target.
//
func (rr *RunRequest) merge(env *Environment, origTarget *Target, origHttpTarget *HttpTarget) {
	if rr.Target.Opts.Duration > 0 &&
		rr.Target.Opts.Duration <= env.MaxAttackDuration {
		origTarget.Opts.Duration = rr.Target.Opts.Duration
	}

	if rr.Target.Opts.RatePerSecond > 0 &&
		rr.Target.Opts.RatePerSecond <= env.MaxAttackRate {
		origTarget.Opts.RatePerSecond = rr.Target.Opts.RatePerSecond
		origTarget.Opts.ratePerSecond = vegeta.Rate{
			Freq: rr.Target.Opts.RatePerSecond,
			Per:  time.Second,
		}
	}

	if rr.Target.Opts.Timeout > 0 &&
		rr.Target.Opts.Timeout <= DefaultAttackTimeout {
		origTarget.Opts.Timeout = rr.Target.Opts.Timeout
	}

	origTarget.Vars = rr.Target.Vars
	rr.Target = origTarget

	origHttpTarget.Headers = rr.HttpTarget.Headers
	origHttpTarget.Params = rr.HttpTarget.Params
	rr.HttpTarget = origHttpTarget
}
