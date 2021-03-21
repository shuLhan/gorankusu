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
// AttackResult represent the output from load testing.
//
type AttackResult struct {
	mtx sync.Mutex

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
// newAttackResult create new load testing result from request.
//
func newAttackResult(env *Environment, rr *RunRequest) (
	ar *AttackResult, err error,
) {
	ar = &AttackResult{
		TargetID: rr.HttpTarget.ID,
		metrics:  &vegeta.Metrics{},
		hist:     &vegeta.Histogram{},
	}

	ar.Name = fmt.Sprintf("%s.%s.%dx%s.%s.bin", ar.TargetID,
		time.Now().Format(outputSuffixDate),
		rr.Target.Opts.RatePerSecond, rr.Target.Opts.Duration,
		env.ResultsSuffix)

	err = ar.hist.Buckets.UnmarshalText([]byte(histogramBuckets))
	if err != nil {
		return nil, fmt.Errorf("newAttackResult: %w", err)
	}

	ar.fullpath = filepath.Join(env.ResultsDir, ar.Name)

	ar.fout, err = os.Create(ar.fullpath)
	if err != nil {
		return nil, fmt.Errorf("newAttackResult: %w", err)
	}

	ar.encoder = vegeta.NewEncoder(ar.fout)

	return ar, nil
}

func (ar *AttackResult) add(res *vegeta.Result) (err error) {
	err = ar.encoder.Encode(res)
	if err != nil {
		return fmt.Errorf("AttackResult.add: %w", err)
	}
	ar.metrics.Add(res)
	ar.hist.Add(res)

	return nil
}

func (ar *AttackResult) cancel() {
	ar.mtx.Lock()
	defer ar.mtx.Unlock()

	ar.IsRunning = false

	if ar.metrics != nil {
		ar.metrics.Close()
	}

	if ar.fout != nil {
		err := ar.fout.Close()
		if err != nil {
			mlog.Errf("AttackResult.cancel %s: %s\n", ar.TargetID, err)
		}
		ar.fout = nil

		if len(ar.fullpath) > 0 {
			err = os.Remove(ar.fullpath)
			if err != nil {
				mlog.Errf("AttackResult.cancel %s: %s\n", ar.TargetID, err)
			}
		}
	}

	ar.metrics = nil
	ar.hist = nil
}

func (ar *AttackResult) finish() (err error) {
	var buf bytes.Buffer

	ar.mtx.Lock()
	defer ar.mtx.Unlock()

	ar.IsRunning = false
	ar.metrics.Close()

	if ar.fout != nil {
		err = ar.fout.Close()
		if err != nil {
			return fmt.Errorf("%s: %w", ar.TargetID, err)
		}
		ar.fout = nil
	}

	text := vegeta.NewTextReporter(ar.metrics)
	err = text.Report(&buf)
	if err != nil {
		return err
	}

	ar.TextReport = libbytes.Copy(buf.Bytes())

	buf.Reset()
	histWriter := vegeta.NewHistogramReporter(ar.hist)
	err = histWriter.Report(&buf)
	if err != nil {
		return err
	}

	ar.HistReport = libbytes.Copy(buf.Bytes())

	ar.metrics = nil
	ar.hist = nil

	return nil
}

func (ar *AttackResult) init(path string) (err error) {
	ar.fullpath = filepath.Join(path, ar.Name)

	result, err := ioutil.ReadFile(ar.fullpath)
	if err != nil {
		return err
	}

	dec := vegeta.NewDecoder(bytes.NewReader(result))

	ar.metrics = &vegeta.Metrics{}
	ar.hist = &vegeta.Histogram{}

	err = ar.hist.Buckets.UnmarshalText([]byte(histogramBuckets))
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
		ar.metrics.Add(&res)
		ar.hist.Add(&res)
	}

	return ar.finish()
}

func (ar *AttackResult) pack() (b []byte, err error) {
	ar.mtx.Lock()
	b, err = json.Marshal(ar)
	ar.mtx.Unlock()
	return b, err
}
