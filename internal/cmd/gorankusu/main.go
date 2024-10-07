// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// Program gorankusu provide an example how to use the Gorankusu module.
package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"git.sr.ht/~shulhan/pakakeh.go/lib/memfs"
	"git.sr.ht/~shulhan/pakakeh.go/lib/mlog"
	"git.sr.ht/~shulhan/pakakeh.go/lib/os/exec"

	"git.sr.ht/~shulhan/ciigo"
	"git.sr.ht/~shulhan/gorankusu"
)

const (
	subCommandBuild = `build`
	cmdTsc          = `tsc --project _www`
)

func main() {
	flag.Parse()

	var subcmd = strings.ToLower(flag.Arg(0))

	switch subcmd {
	case subCommandBuild:
		var opts = ciigo.ConvertOptions{
			Root: `_www/doc`,
		}
		var err = ciigo.Convert(opts)
		if err != nil {
			log.Println(err)
		}

		workerBuild(true)
		return
	}

	var (
		listenAddress = `127.0.0.1:18217`
		isDev         = true

		ex  *gorankusu.Example
		err error
	)

	ex, err = gorankusu.NewExample(listenAddress, isDev)
	if err != nil {
		mlog.Fatalf(`%s`, err)
	}

	go workerBuild(false)
	go workerDocs()

	go func() {
		var c = make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM)
		<-c
		ex.Stop()
	}()

	err = ex.Start()
	if err != nil {
		mlog.Fatalf(`%s`, err)
	}
}

// workerBuild watch update on .ts and .js files inside _www directory.
//
// Every 5 seconds, it will recompile TypeScript to JavaScript, by running
// tsc, if only if there is at least one .ts file being.
// After that, if there is an update to .js files, it will run scripts that
// embed them into Go source code.
//
// If oneTime parameter is true, it will recompile the .ts and embed the .js
// files only, without watching updates.
func workerBuild(oneTime bool) {
	var (
		logp       = `workerBuild`
		tsCount    = 0
		embedCount = 0
	)

	var mfsOpts = &memfs.Options{
		Root: `_www`,
		Includes: []string{
			`.*\.(js|ico|png|html)$`,
		},
		Excludes: []string{
			`.*\.adoc`,
			`.*\.git`,
			`.*\.ts`,
			`/node_modules`,
			`/wui/.*/example.js$`,
			`/wui/.*/index.html$`,
			`/wui/index\.html$`,
			`/wui\.bak`,
			`/wui\.local`,
		},
		Embed: memfs.EmbedOptions{
			CommentHeader: `// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
`,
			PackageName: `gorankusu`,
			VarName:     `memfsWWW`,
			GoFileName:  `memfs_www_embed.go`,
		},
	}

	var (
		mfsWww *memfs.MemFS
		err    error
	)

	mfsWww, err = memfs.New(mfsOpts)
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
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

	var dirWatchWww = memfs.DirWatcher{
		Options: memfs.Options{
			Root: `_www`,
			Includes: []string{
				`.*\.(js|ts)$`,
				`_www/tsconfig.json`,
			},
			Excludes: []string{
				`.*\.adoc$`,
				`.*\.d\.ts$`,
				`.*\.git/.*`,
				`/node_modules`,
				`/wui/.*/example.js$`,
				`/wui/.*/index.html$`,
				`/wui/index\.html$`,
				`/wui\.bak`,
				`/wui\.local`,
				`doc`,
			},
		},
	}

	err = dirWatchWww.Start()
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
	}

	mlog.Outf(`%s: started ...`, logp)

	var (
		ticker = time.NewTicker(5 * time.Second)
		ns     memfs.NodeState
	)
	for {
		select {
		case ns = <-dirWatchWww.C:
			if strings.HasSuffix(ns.Node.SysPath, `.ts`) {
				mlog.Outf(`%s: update %s`, logp, ns.Node.SysPath)
				tsCount++
			} else if strings.HasSuffix(ns.Node.SysPath, `.json`) {
				mlog.Outf(`%s: update %s`, logp, ns.Node.SysPath)
				tsCount++
			} else if strings.HasSuffix(ns.Node.SysPath, `.js`) ||
				strings.HasSuffix(ns.Node.SysPath, `.html`) {
				embedCount++
				mlog.Outf(`%s: update %s`, logp, ns.Node.Path)

				var node *memfs.Node

				node, err = mfsWww.Get(ns.Node.Path)
				if err != nil {
					mlog.Errf(`%s: %q: %s`, logp, ns.Node.Path, err)
					continue
				}
				if node != nil {
					err = node.Update(nil, 0)
					if err != nil {
						mlog.Errf(`%s: %q: %s`, logp, node.Path, err)
					}
				}
			} else {
				mlog.Outf(`%s: unknown file updated %s`, logp, ns.Node.SysPath)
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

// workerDocs a goroutine that watch any changes to .adoc files inside
// "_www/doc" directory and convert them into HTML files.
func workerDocs() {
	var logp = `workerDocs`

	mlog.Outf(`%s: started ...`, logp)

	var opts = ciigo.ConvertOptions{
		Root: `_www/doc`,
	}
	var err = ciigo.Watch(opts)
	if err != nil {
		mlog.Errf(`%s: %s`, logp, err)
	}
}

func doRunTsc(logp string) (err error) {
	mlog.Outf(`%s: execute %s`, logp, cmdTsc)
	err = exec.Run(cmdTsc, nil, nil)
	if err != nil {
		mlog.Errf(`%s: %s`, logp, err)
		return err
	}
	return nil
}

func doGoEmbed(logp string, mfs *memfs.MemFS) (err error) {
	mlog.Outf(`%s: generate memfs_www_embed.go`, logp)
	err = mfs.GoEmbed()
	if err != nil {
		mlog.Errf(`%s: %s`, logp, err)
		return err
	}
	return nil
}
