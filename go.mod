// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

module git.sr.ht/~shulhan/gorankusu

go 1.22

toolchain go1.23.0

require (
	git.sr.ht/~shulhan/ciigo v0.13.2
	git.sr.ht/~shulhan/pakakeh.go v0.57.0
	github.com/tsenart/vegeta/v12 v12.12.0
	golang.org/x/tools v0.24.0
)

require (
	git.sr.ht/~shulhan/asciidoctor-go v0.6.0 // indirect
	github.com/influxdata/tdigest v0.0.1 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/rogpeppe/go-internal v1.10.0 // indirect
	github.com/rs/dnscache v0.0.0-20230804202142-fc85eb664529 // indirect
	github.com/yuin/goldmark v1.7.4 // indirect
	github.com/yuin/goldmark-meta v1.1.0 // indirect
	golang.org/x/mod v0.20.0 // indirect
	golang.org/x/net v0.29.0 // indirect
	golang.org/x/sync v0.8.0 // indirect
	golang.org/x/sys v0.25.0 // indirect
	golang.org/x/text v0.18.0 // indirect
	gopkg.in/check.v1 v1.0.0-20201130134442-10cb98267c6c // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

//replace git.sr.ht/~shulhan/pakakeh.go => ../pakakeh.go
