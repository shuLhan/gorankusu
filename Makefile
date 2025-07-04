## SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

COVER_OUT:=cover.out
COVER_HTML:=cover.html

.PHONY: all
all: lint test build

.PHONY: init
init:
	git submodule update --init
	cd _www && yarn install

.PHONY: lint
lint: lint-www
	go run ./internal/cmd/gocheck ./...
	go vet ./...

.PHONY: lint-www
lint-www:
	cd _www && ./node_modules/.bin/eslint .

.PHONY: test
test:
	CGO_ENABLED=1 go test -failfast -timeout=1m -race -coverprofile=$(COVER_OUT) ./...
	go tool cover -html=$(COVER_OUT) -o $(COVER_HTML)

.PHONY: build
build:
	go run ./internal/cmd/gorankusu build

.PHONY: dev
dev:
	go run ./internal/cmd/gorankusu -dev
