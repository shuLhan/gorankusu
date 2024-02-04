// SPDX-FileCopyrightText: 2024 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"crypto/rand"
	"log"
	"net/http"
	"os"
	"testing"
	"time"

	libhttp "github.com/shuLhan/share/lib/http"
	"github.com/shuLhan/share/lib/test/mock"
)

// dummyHttpd dummy HTTP as target for Trunks.
var dummyHttpd *httpdDummy

// dummyTrunks the Trunks instance that contains [Target] to be tested.
var dummyTrunks *Trunks

func TestMain(m *testing.M) {
	var err error

	// Mock crypto [rand.Reader] for predictable HTTP boundary.
	rand.Reader = mock.NewRandReader([]byte(`gorankusu`))

	dummyHttpd, err = newHttpdDummy()
	if err != nil {
		log.Fatal(err)
	}
	defer dummyHttpd.Stop(time.Second)

	var env = Environment{}

	dummyTrunks, err = New(&env)
	if err != nil {
		log.Fatal(err)
	}

	registerTargetHTTP()

	os.Exit(m.Run())
}

func registerTargetHTTP() {
	var logp = `registerTargetHTTP`

	var target = &Target{
		ID:      `target_http`,
		Name:    `Target HTTP`,
		BaseURL: `http://` + dummyHttpd.Server.Options.Address,
	}
	var targetHTTPUpload = &HTTPTarget{
		ID:          `upload`,
		Name:        `Upload`,
		Method:      dummyEndpointUpload.Method,
		Path:        dummyEndpointUpload.Path,
		RequestType: dummyEndpointUpload.RequestType,
		Params: KeyFormInput{
			`file`: FormInput{
				Label: `File`,
				Kind:  FormInputKindFile,
			},
		},
		RequestDumper:  requestDumperWithoutDate,
		ResponseDumper: responseDumperWithoutDate,
	}
	target.HTTPTargets = append(target.HTTPTargets, targetHTTPUpload)

	var err = dummyTrunks.RegisterTarget(target)
	if err != nil {
		log.Fatalf(`%s: %s`, logp, err)
	}
}

func requestDumperWithoutDate(req *http.Request) ([]byte, error) {
	req.Header.Del(libhttp.HeaderDate)
	return DumpHTTPRequest(req)
}

func responseDumperWithoutDate(resp *http.Response) ([]byte, error) {
	resp.Header.Del(libhttp.HeaderDate)
	return DumpHTTPResponse(resp)
}
