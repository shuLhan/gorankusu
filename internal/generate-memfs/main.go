// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"os"

	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
)

func main() {
	log.SetPrefix(os.Args[0])

	opts := &memfs.Options{
		Root: "_www",
	}

	mfs, err := memfs.New(opts)
	if err != nil {
		log.Fatalf("%s\n", err)
	}

	err = mfs.GoGenerate("trunks", "memfsWWW", "memfs_www_generate.go", "")
	if err != nil {
		mlog.Fatalf("%s\n", err)
	}
}
