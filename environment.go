// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"fmt"
	"os"
	"sync"
	"time"
)

// DefaultListenAddress define default gorankusu server address.
const DefaultListenAddress = `127.0.0.1:8217`

// DefaultMaxAttackDuration define maximum duration attack can run on
// all Target.
// This is default value for [Environment.MaxAttackDuration].
const DefaultMaxAttackDuration = 30 * time.Second

// DefaultMaxAttackRate define maximum rate an attack can run.
// This is default value for [Environment.MaxAttackRate].
const DefaultMaxAttackRate = 3000

// Environment contains global configuration for load testing.
type Environment struct {
	// AttackRunning will be set to non-nil if there is a load
	// testing currently running.
	AttackRunning *RunRequest

	// ListenAddress is the address and port where Gorankusu HTTP web
	// will run.
	// If its emtpy, it will set to DefaultListenAddress.
	ListenAddress string `ini:"gorankusu::listen_address"`

	// ResultsDir is the path where the output of load testing will be
	// stored.
	// This field is optional, if its empty it will be set to the working
	// directory where the program is running.
	ResultsDir string `ini:"gorankusu:results:dir"`

	// ResultsSuffix define custom string to add to the file name to
	// uniquely identify results on each run.
	ResultsSuffix string `ini:"gorankusu:result:suffix"`

	// MaxAttackRate define the maximum AttackRate can be set by client.
	// The purpose of this option is to prevent client to set attack rate
	// which may bring down the service to be tested.
	// This field is optional, default to DefaultMaxAttackRate if its
	// zero.
	MaxAttackRate int `ini:"gorankusu::max_attack_rate"`

	// MaxAttackDuration define the maximum duration for an attack to be
	// run on each target.
	// The purpose of this option is to prevent client to attack service
	// and bringing it down.
	// This field is optional, default to DefaultMaxAttackDuration if its
	// zero.
	MaxAttackDuration time.Duration `ini:"gorankusu::max_attack_duration"`

	mtx sync.Mutex
}

func (env *Environment) init() (err error) {
	logp := "Environment.init"

	if len(env.ListenAddress) == 0 {
		env.ListenAddress = DefaultListenAddress
	}
	if env.MaxAttackRate == 0 {
		env.MaxAttackRate = DefaultMaxAttackRate
	}
	if env.MaxAttackDuration == 0 {
		env.MaxAttackDuration = DefaultMaxAttackDuration
	}

	if len(env.ResultsDir) == 0 {
		env.ResultsDir, err = os.Getwd()
		if err != nil {
			return fmt.Errorf("%s: %w", logp, err)
		}
	}

	return nil
}

func (env *Environment) getRunningAttack() (rr *RunRequest) {
	env.mtx.Lock()
	rr = env.AttackRunning
	env.mtx.Unlock()
	return rr
}

func (env *Environment) isAttackRunning() (yorn bool) {
	env.mtx.Lock()
	yorn = (env.AttackRunning != nil)
	env.mtx.Unlock()
	return yorn
}
