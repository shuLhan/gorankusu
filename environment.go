// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"os"
	"sync"
	"time"
)

//
// Environment contains global configuration for load testing.
//
type Environment struct {
	// ListenAddress is the address and port where Trunks HTTP service
	// will run.
	// If its emtpy, it will set to DefaultListenAddress.
	ListenAddress string `ini:"trunks::listen_address"`

	// MaxAttackDuration define the maximum duration for an attack to be
	// run on each target.
	// The purpose of this option is to prevent client to attack service
	// and bringing it down.
	// This field is optional, default to DefaultMaxAttackDuration if its
	// zero.
	MaxAttackDuration time.Duration `ini:"trunks::max_attack_duration"`

	// MaxAttackRate define the maximum AttackRate can be set by client.
	// The purpose of this option is to prevent client to set attack rate
	// which may bring down the service to be tested.
	// This field is optional, default to DefaultMaxAttackRate if its
	// zero.
	MaxAttackRate int `ini:"trunks::max_attack_rate"`

	// ResultsDir is the path where the output of load testing will be
	// stored.
	// This field is optional, if its empty it will be set to the working
	// directory where the program is running.
	ResultsDir string `ini:"trunks:results:dir"`

	// ResultsSuffix define custom string to add to the file name to
	// uniquely identify results on each run.
	ResultsSuffix string `ini:"trunks:result:suffix"`

	// LoadTestingRunning will be set to non-nil if there is a load
	// testing currently running.
	LoadTestingRunning *loadTestingResult
	mtx                sync.Mutex
}

func (env *Environment) init() (err error) {
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
			return err
		}
	}

	return nil
}
