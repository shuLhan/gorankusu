## Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

.PHONY: all run embed tsc

all:
	go run ./internal/cmd/trunks-example build
	go test -v -race ./...

run:
	go run ./internal/cmd/trunks-example
