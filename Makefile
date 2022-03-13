## SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

.PHONY: all dev

all:
	go run ./internal/cmd/trunks build
	CGO_ENABLED=1 go test -v -race ./...

dev:
	go run ./internal/cmd/trunks
