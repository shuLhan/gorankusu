// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package gorankusu

import (
	"crypto/rand"
	"log"
	"os"
	"testing"
	"time"

	libnet "git.sr.ht/~shulhan/pakakeh.go/lib/net"
	"git.sr.ht/~shulhan/pakakeh.go/lib/test/mock"
)

// exGorankusu the Gorankusu instance that contains [Target] to be
// tested.
var exGorankusu *Example

func TestMain(m *testing.M) {
	var err error

	// Mock crypto [rand.Reader] for predictable HTTP boundary.
	rand.Reader = mock.NewRandReader([]byte(`gorankusu`))

	exGorankusu, err = NewExample(``, false)
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		var err2 = exGorankusu.Start()
		if err2 != nil {
			log.Fatal(err2)
		}
	}()

	err = libnet.WaitAlive(`tcp`, DefaultListenAddress, 3*time.Second)
	if err != nil {
		log.Fatal(err)
	}

	var status = m.Run()
	os.Exit(status)
}
