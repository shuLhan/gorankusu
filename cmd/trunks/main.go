// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

//
// Program trunks provide an example how to use the Trunks module.
//
package main

import (
	"os"
	"os/signal"
	"syscall"

	"git.sr.ht/~shulhan/trunks/example"
	"github.com/shuLhan/share/lib/mlog"
)

func main() {
	ex, err := example.New()
	if err != nil {
		mlog.Fatalf("%s\n", err)
	}

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM)
		<-c
		ex.Stop()
	}()

	err = ex.Start()
	if err != nil {
		mlog.Fatalf("%s\n", err)
	}
}
