// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

// Program gorankusu provide an example how to use the Gorankusu module.
package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"git.sr.ht/~shulhan/pakakeh.go/lib/memfs"
	"git.sr.ht/~shulhan/pakakeh.go/lib/mlog"
	"git.sr.ht/~shulhan/pakakeh.go/lib/os/exec"
	"git.sr.ht/~shulhan/pakakeh.go/lib/watchfs/v2"

	"git.sr.ht/~shulhan/ciigo"
	"git.sr.ht/~shulhan/gorankusu"
)

const (
	subCommandBuild = `build`
	cmdTsc          = `_www/node_modules/.bin/tsc --project _www`
)

func main() {
	var (
		listenAddress string
		isDev         bool
	)
	flag.BoolVar(&isDev, `dev`, false, `Run in development mode`)
	flag.StringVar(&listenAddress, `http`, `127.0.0.1:10007`, `Address to serve`)
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
		ex  *gorankusu.Example
		err error
	)

	ex, err = gorankusu.NewExample(listenAddress, isDev)
	if err != nil {
		mlog.Fatalf(`%s`, err)
	}

	if isDev {
		go workerBuild(false)
		go workerDocs()
	}

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
			`/pakakeh_ts/.*/example\.js$`,
			`/pakakeh_ts/.*/index\.html$`,
			`/pakakeh_ts/index\.html$`,
		},
		Embed: memfs.EmbedOptions{
			CommentHeader: `// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
`,
			PackageName: `gorankusu`,
			VarName:     `memfsWWW`,
			GoFileName:  `memfs_www_embed.go`,
		},
		TryDirect: true,
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

	var watchOpts = watchfs.DirWatcherOptions{
		FileWatcherOptions: watchfs.FileWatcherOptions{
			File:     filepath.Join(`_www`, `.rescan`),
			Interval: 5 * time.Second,
		},
		Root: `_www`,
		Includes: []string{
			`.*\.(html|js|ts)$`,
			`_www/tsconfig.json`,
		},
		Excludes: []string{
			`.*\.adoc$`,
			`.*\.d\.ts$`,
			`.*\.git/.*`,
			`/node_modules`,
			`/pakakeh_ts/.*/example\.js$`,
			`/pakakeh_ts/.*/index\.html$`,
			`/pakakeh_ts/index\.html$`,
		},
	}

	var dirWatchWww *watchfs.DirWatcher
	dirWatchWww, err = watchfs.WatchDir(watchOpts)
	if err != nil {
		mlog.Fatalf(`%s: %s`, logp, err)
	}

	mlog.Outf(`%s: started ...`, logp)

	var (
		ticker      = time.NewTicker(5 * time.Second)
		listChanges []os.FileInfo
	)
	for {
		select {
		case listChanges = <-dirWatchWww.C:
			for _, fi := range listChanges {
				var name = fi.Name()
				name = strings.TrimPrefix(name, `_www`)
				if strings.HasSuffix(name, `.ts`) {
					mlog.Outf(`%s: update %s`, logp, name)
					tsCount++
				} else if strings.HasSuffix(name, `.json`) {
					mlog.Outf(`%s: update %s`, logp, name)
					tsCount++
				} else if strings.HasSuffix(name, `.js`) ||
					strings.HasSuffix(name, `.html`) {
					embedCount++
					mlog.Outf(`%s: update %s`, logp, name)

					var node *memfs.Node

					node, err = mfsWww.Get(name)
					if err != nil {
						mlog.Errf(`%s: %q: %s`, logp, name, err)
						continue
					}
					if node != nil {
						err = node.Update(nil, 0)
						if err != nil {
							mlog.Errf(`%s: %q: %s`, logp, node.Path, err)
						}
					}
				} else {
					mlog.Outf(`%s: unknown file updated %s`, logp, name)
				}
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
