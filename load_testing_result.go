// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"

	libbytes "github.com/shuLhan/share/lib/bytes"
	"github.com/shuLhan/share/lib/mlog"
)

const (
	histogramBuckets = "[0,1ms,5ms,10ms,20ms,30ms,40ms,50ms,100ms,500ms,1s,5s,10s,20s,30s,40s]"
	outputSuffixDate = "20060102_150405"
)

//
// loadTestingResult represent the output from load testing.
//
type loadTestingResult struct {
	sync.Mutex

	TargetID   string // TargetID the ID of HTTP target which own the result.
	Name       string // Name of output file without path.
	IsRunning  bool
	TextReport []byte // TextReport the result reported as text.
	HistReport []byte // HistReport the result reported as histogram text.

	fullpath string
	fout     *os.File
	encoder  vegeta.Encoder
	metrics  *vegeta.Metrics
	hist     *vegeta.Histogram
}

//
// newLoadTestingResult create new load testing result from request.
//
func newLoadTestingResult(env *Environment, rr *RunRequest) (
	ltr *loadTestingResult, err error,
) {
	ltr = &loadTestingResult{
		TargetID: rr.HttpTarget.ID,
		metrics:  &vegeta.Metrics{},
		hist:     &vegeta.Histogram{},
	}

	ltr.Name = fmt.Sprintf("%s.%s.%dx%s.%s.bin", ltr.TargetID,
		time.Now().Format(outputSuffixDate),
		rr.Target.Opts.RatePerSecond, rr.Target.Opts.Duration,
		env.ResultsSuffix)

	err = ltr.hist.Buckets.UnmarshalText([]byte(histogramBuckets))
	if err != nil {
		return nil, fmt.Errorf("newLoadTestingResult: %w", err)
	}

	ltr.fullpath = filepath.Join(env.ResultsDir, ltr.Name)

	ltr.fout, err = os.Create(ltr.fullpath)
	if err != nil {
		return nil, fmt.Errorf("newLoadTestingResult: %w", err)
	}

	ltr.encoder = vegeta.NewEncoder(ltr.fout)

	return ltr, nil
}

func (ltr *loadTestingResult) add(res *vegeta.Result) (err error) {
	err = ltr.encoder.Encode(res)
	if err != nil {
		return fmt.Errorf("loadTestingResult.add: %w", err)
	}

	ltr.metrics.Add(res)
	ltr.hist.Add(res)

	return nil
}

func (ltr *loadTestingResult) cancel() {
	ltr.Lock()
	defer ltr.Unlock()

	ltr.IsRunning = false

	if ltr.metrics != nil {
		ltr.metrics.Close()
	}

	if ltr.fout != nil {
		err := ltr.fout.Close()
		if err != nil {
			mlog.Errf("loadTestingResult.cancel %s: %s\n", ltr.TargetID, err)
		}
		ltr.fout = nil

		if len(ltr.fullpath) > 0 {
			err = os.Remove(ltr.fullpath)
			if err != nil {
				mlog.Errf("loadTestingResult.cancel %s: %s\n", ltr.TargetID, err)
			}
		}
	}

	ltr.metrics = nil
	ltr.hist = nil
}

func (ltr *loadTestingResult) finish() (err error) {
	var buf bytes.Buffer

	ltr.Lock()
	defer ltr.Unlock()

	ltr.IsRunning = false
	ltr.metrics.Close()

	if ltr.fout != nil {
		err = ltr.fout.Close()
		if err != nil {
			return fmt.Errorf("%s: %w", ltr.TargetID, err)
		}
		ltr.fout = nil
	}

	text := vegeta.NewTextReporter(ltr.metrics)
	err = text.Report(&buf)
	if err != nil {
		return err
	}

	ltr.TextReport = libbytes.Copy(buf.Bytes())

	buf.Reset()
	histWriter := vegeta.NewHistogramReporter(ltr.hist)
	err = histWriter.Report(&buf)
	if err != nil {
		return err
	}

	ltr.HistReport = libbytes.Copy(buf.Bytes())

	ltr.metrics = nil
	ltr.hist = nil

	return nil
}

func (ltr *loadTestingResult) init(path string) (err error) {
	ltr.fullpath = filepath.Join(path, ltr.Name)

	result, err := ioutil.ReadFile(ltr.fullpath)
	if err != nil {
		return err
	}

	dec := vegeta.NewDecoder(bytes.NewReader(result))

	ltr.metrics = &vegeta.Metrics{}
	ltr.hist = &vegeta.Histogram{}

	err = ltr.hist.Buckets.UnmarshalText([]byte(histogramBuckets))
	if err != nil {
		return err
	}

	for {
		var res vegeta.Result
		err = dec.Decode(&res)
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return err
		}
		ltr.metrics.Add(&res)
		ltr.hist.Add(&res)
	}

	return ltr.finish()
}

func (ltr *loadTestingResult) pack() (b []byte, err error) {
	ltr.Lock()
	b, err = json.Marshal(ltr)
	ltr.Unlock()
	return b, err
}
