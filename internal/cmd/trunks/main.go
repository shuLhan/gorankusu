// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

//
// Program trunks provide an example how to use the Trunks module.
//
package main

import (
	"flag"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/shuLhan/share/lib/io"
	"github.com/shuLhan/share/lib/memfs"
	"github.com/shuLhan/share/lib/mlog"
	"github.com/shuLhan/share/lib/os/exec"

	"git.sr.ht/~shulhan/ciigo"
	"git.sr.ht/~shulhan/trunks"
	"git.sr.ht/~shulhan/trunks/example"
)

const (
	subCommandBuild = "build"
	cmdTsc          = "tsc -b _www"
)

func main() {
	flag.Parse()
	subcmd := strings.ToLower(flag.Arg(0))

	if subcmd == subCommandBuild {
		workerBuild(true)
		return
	}

	err := os.Setenv(trunks.EnvDevelopment, "1")
	if err != nil {
		mlog.Fatalf("%s\n", err)
	}

	ex, err := example.New()
	if err != nil {
		mlog.Fatalf("%s\n", err)
	}

	go workerBuild(false)
	go workerDocs()

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

//
// workerBuild watch update on .ts and .js files inside _www directory.
//
// Every 5 seconds, it will recompile TypeScript to JavaScript, by running
// tsc, if only if there is at least one .ts file being.
// After that, if there is an update to .js files, it will run scripts that
// embed them into Go source code.
//
// If oneTime parameter is true, it will recompile the .ts and embed the .js
// files only, without watching updates.
//
func workerBuild(oneTime bool) {
	var (
		logp       = "workerBuild"
		tsCount    = 0
		embedCount = 0
		changeq    = make(chan *io.NodeState, 64)
	)

	mfsOpts := &memfs.Options{
		Root: "_www",
		Includes: []string{
			`.*\.(js|ico|png|html)$`,
		},
		Excludes: []string{
			`.*\.adoc`,
			`.*\.git`,
			`.*\.ts`,
			`/wui/.*/example.js$`,
			`/wui/.*/index.html$`,
			`/wui/index\.html$`,
			`/wui\.bak`,
			`/wui\.local`,
		},
		Embed: memfs.EmbedOptions{
			PackageName: "trunks",
			VarName:     "memfsWWW",
			GoFileName:  "memfs_www_embed.go",
		},
	}

	mfsWww, err := memfs.New(mfsOpts)
	if err != nil {
		mlog.Fatalf("%s: %s", logp, err)
	}

	if oneTime {
		err = doRunTsc(logp)
		if err != nil {
			os.Exit(1)
		}
		err = doGoEmbed(logp, mfsWww)
		if err != nil {
			os.Exit(1)
		}
		return
	}

	dirWatchWww := io.DirWatcher{
		Options: memfs.Options{
			Root: "_www",
			Includes: []string{
				`.*\.(js|ts)$`,
				`_www/tsconfig.json`,
			},
			Excludes: []string{
				`.*\.adoc$`,
				`.*\.d\.ts$`,
				`.*\.git/.*`,
				`/wui/.*/example.js$`,
				`/wui/.*/index.html$`,
				`/wui/index\.html$`,
				`/wui\.bak`,
				`/wui\.local`,
				`docs`,
			},
		},
		Callback: func(ns *io.NodeState) {
			changeq <- ns
		},
	}

	err = dirWatchWww.Start()
	if err != nil {
		mlog.Fatalf("%s: %s", logp, err)
	}

	mlog.Outf("%s: started ...\n", logp)

	ticker := time.NewTicker(5 * time.Second)
	for {
		select {
		case ns := <-changeq:
			if strings.HasSuffix(ns.Node.SysPath, ".ts") {
				mlog.Outf("%s: update %s\n", logp, ns.Node.SysPath)
				tsCount++
			} else if strings.HasSuffix(ns.Node.SysPath, ".json") {
				mlog.Outf("%s: update %s\n", logp, ns.Node.SysPath)
				tsCount++
			} else if strings.HasSuffix(ns.Node.SysPath, ".js") ||
				strings.HasSuffix(ns.Node.SysPath, ".html") {
				embedCount++
				mlog.Outf("%s: update %s\n", logp, ns.Node.Path)
				node, err := mfsWww.Get(ns.Node.Path)
				if err != nil {
					mlog.Errf("%s: %q: %s", logp, ns.Node.Path, err)
					continue
				}
				if node != nil {
					err = node.Update(nil, 0)
					if err != nil {
						mlog.Errf("%s: %q: %s", logp, node.Path, err)
					}
				}
			} else {
				mlog.Outf("%s: unknown file updated %s\n", logp, ns.Node.SysPath)
			}

		case <-ticker.C:
			if tsCount > 0 {
				tsCount = 0
				_ = doRunTsc(logp)
			}
			if embedCount > 0 {
				embedCount = 0
				_ = doGoEmbed(logp, mfsWww)
			}
		}
	}
}

//
// workerDocs a goroutine that watch any changes to .adoc files inside
// "_www/docs" directory and convert them into HTML files.
//
func workerDocs() {
	logp := "workerDocs"

	mlog.Outf("%s: started ...\n", logp)

	opts := &ciigo.ConvertOptions{
		Root: "_www/docs",
	}
	err := ciigo.Watch(opts)
	if err != nil {
		mlog.Errf("%s: %s", logp, err)
	}
}

func doRunTsc(logp string) (err error) {
	mlog.Outf("%s: execute %s\n", logp, cmdTsc)
	err = exec.Run(cmdTsc, nil, nil)
	if err != nil {
		mlog.Errf("%s: %s", logp, err)
		return err
	}
	return nil
}

func doGoEmbed(logp string, mfs *memfs.MemFS) (err error) {
	mlog.Outf("%s: generate memfs_www_embed.go\n", logp)
	err = mfs.GoEmbed()
	if err != nil {
		mlog.Errf("%s: %s", logp, err)
		return err
	}
	return nil
}