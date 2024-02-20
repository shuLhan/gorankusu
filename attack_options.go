// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"
)

// DefaultAttackDuration define default attack duration per Target.
// This is default value for [AttackOptions.Duration].
const DefaultAttackDuration = 10 * time.Second

// DefaultAttackRatePerSecond define default attack rate per second per
// Target.
// This is default value for [AttackOptions.RatePerSecond].
const DefaultAttackRatePerSecond = 500

// DefaultAttackTimeout define default timeout for each attack request.
// This is default value for [AttackOptions.Timeout].
const DefaultAttackTimeout = 30 * time.Second

// AttackOptions define the options for attacking HTTP endpoint.
type AttackOptions struct {
	// Duration define the duration for each attack to be executed,
	// in seconds.
	// For example, if the AttackRate is 500 and AttackDuration is 10
	// seconds, the total of request for each target will be 5000
	// requests.
	// This field is optional, default to DefaultAttackDuration if its
	// zero.
	Duration time.Duration

	// RatePerSecond define the number of request per second.
	// This field is optional, default to DefaultAttackRatePerSecond if
	// its zero.
	RatePerSecond int
	ratePerSecond vegeta.Rate

	// Timeout define the overall time to run the attack on each target.
	// This field is optional, default to DefaultAttackTimeout if its
	// zero.
	Timeout time.Duration
}

func (attackOpts *AttackOptions) init() {
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
}
