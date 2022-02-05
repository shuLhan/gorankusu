## Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
## Use of this source code is governed by a BSD-style
## license that can be found in the LICENSE file.

.PHONY: all dev

all:
	go run ./internal/cmd/trunks build
	CGO_ENABLED=1 go test -v -race ./...

dev:
	go run ./internal/cmd/trunks
