// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"
)

type AttackOptions struct {
	// BaseUrl contains the target address that serve the service to
	// be tested.
	// This field is required.
	BaseUrl string `ini:"trunks:attack:base_url"`

	// Duration define the duration for each attack to be executed,
	// in seconds.
	// For example, if the AttackRate is 500 and AttackDuration is 10
	// seconds, the total of request for each target will be 5000
	// requests.
	// This field is optional, default to DefaultAttackDuration if its
	// zero.
	Duration time.Duration `ini:"trunks:attack:duration"`

	// RatePerSecond define the number of request per second.
	// This field is optional, default to DefaultAttackRatePerSecond if
	// its zero.
	RatePerSecond int `ini:"trunks:attack:rate_per_second"`
	ratePerSecond vegeta.Rate

	// Timeout define the overall time to run the attack on each target.
	// This field is optional, default to DefaultAttackTimeout if its
	// zero.
	Timeout time.Duration `ini:"trunks:attack:timeout"`
}

func (attackOpts *AttackOptions) init() (err error) {
	if len(attackOpts.BaseUrl) == 0 {
		return fmt.Errorf("AttackOptions.BaseUrl is not defined")
	}

	if attackOpts.Timeout == 0 {
		attackOpts.Timeout = DefaultAttackTimeout
	}

	if attackOpts.RatePerSecond == 0 {
		attackOpts.RatePerSecond = DefaultAttackRatePerSecond
	}
	attackOpts.ratePerSecond = vegeta.Rate{
		Freq: attackOpts.RatePerSecond,
		Per:  time.Second,
	}
	if attackOpts.Duration == 0 {
		attackOpts.Duration = DefaultAttackDuration
	}
	return nil
}
