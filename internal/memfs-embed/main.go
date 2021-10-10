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
		Excludes: []string{
			`.*\.adoc`,
			`.*\.git`,
			`.*\.ts`,
			`/wui/.*/example.js$`,
			`/wui/.*/index.html$`,
			`/wui/LICENSE$`,
			`/wui/Makefile$`,
			`/wui/NOTES$`,
			`/wui/README.adoc$`,
			`/wui/index\.html$`,
			`/wui/tsconfig\.json$`,
			`/wui\.bak`,
			`/wui\.local`,
		},
	}

	mfs, err := memfs.New(opts)
	if err != nil {
		log.Fatalf("%s\n", err)
	}

	err = mfs.GoEmbed("trunks", "memfsWWW", "memfs_www_embed.go", "")
	if err != nil {
		mlog.Fatalf("%s\n", err)
	}
}
