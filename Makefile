## SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
## SPDX-License-Identifier: GPL-3.0-or-later

.PHONY: all
all: lint test
	go run ./internal/cmd/trunks build

.PHONY: lint
lint: lint-www
	-revive ./...
	-fieldalignment ./...
	-shadow ./...

.PHONY: lint-www
lint-www:
	cd _www && npx eslint --fix .

.PHONY: test
test:
	CGO_ENABLED=1 go test -v -race ./...

.PHONY: dev
dev:
	go run ./internal/cmd/trunks
