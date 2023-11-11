## SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

.PHONY: all
all: lint
	go run ./internal/cmd/trunks build
	CGO_ENABLED=1 go test -v -race ./...
	-golangci-lint run ./...

.PHONY: lint
lint:
	cd _www && npx eslint --fix .

.PHONY: dev
dev:
	go run ./internal/cmd/trunks
