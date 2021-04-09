## Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

.PHONY: all run

all: memfs_www_generate.go
	go test -v -race ./...

run:
	DEBUG=3 go run ./cmd/trunks-example

memfs_www_generate.go: _www/*
	go run ./internal/generate-memfs
