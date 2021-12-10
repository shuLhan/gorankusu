// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"net"
	"os"
	"sync"
	"time"
)

//
// Environment contains global configuration for load testing.
//
type Environment struct {
	// AttackRunning will be set to non-nil if there is a load
	// testing currently running.
	AttackRunning *RunRequest

	// ListenAddress is the address and port where Trunks HTTP web
	// will run.
	// If its emtpy, it will set to DefaultListenAddress.
	ListenAddress string `ini:"trunks::listen_address"`

	websocketListenAddress string

	// ResultsDir is the path where the output of load testing will be
	// stored.
	// This field is optional, if its empty it will be set to the working
	// directory where the program is running.
	ResultsDir string `ini:"trunks:results:dir"`

	// ResultsSuffix define custom string to add to the file name to
	// uniquely identify results on each run.
	ResultsSuffix string `ini:"trunks:result:suffix"`

	// WebSocketListenPort is the port number where Trunks WebSocket API
	// will run.
	// If its empty, it will set to DefaultWebSocketListenPort.
	WebSocketListenPort int

	// MaxAttackRate define the maximum AttackRate can be set by client.
	// The purpose of this option is to prevent client to set attack rate
	// which may bring down the service to be tested.
	// This field is optional, default to DefaultMaxAttackRate if its
	// zero.
	MaxAttackRate int `ini:"trunks::max_attack_rate"`

	// MaxAttackDuration define the maximum duration for an attack to be
	// run on each target.
	// The purpose of this option is to prevent client to attack service
	// and bringing it down.
	// This field is optional, default to DefaultMaxAttackDuration if its
	// zero.
	MaxAttackDuration time.Duration `ini:"trunks::max_attack_duration"`

	mtx sync.Mutex
}

func (env *Environment) init() (err error) {
	logp := "Environment.init"

	if len(env.ListenAddress) == 0 {
		env.ListenAddress = DefaultListenAddress
	}
	if env.WebSocketListenPort <= 0 {
		env.WebSocketListenPort = DefaultWebSocketListenPort
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

	host, _, err := net.SplitHostPort(env.ListenAddress)
	if err != nil {
		return fmt.Errorf("%s: %w", logp, err)
	}
	env.websocketListenAddress = fmt.Sprintf("%s:%d", host, env.WebSocketListenPort)

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
