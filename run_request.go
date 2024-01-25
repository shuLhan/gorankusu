// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"fmt"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"
)

// RunRequest define the request to run HTTP or WebSocket target.
type RunRequest struct {
	result *AttackResult

	Target          Target
	WebSocketTarget WebSocketTarget
	HttpTarget      HttpTarget
}

// generateRunRequest merge the run request with original target and HTTP
// target into new RunRequest.
func generateRunRequest(
	env *Environment,
	req *RunRequest,
	origTarget *Target,
	origHttpTarget *HttpTarget,
) (outrr *RunRequest) {
	if req.Target.Opts.Duration > 0 && req.Target.Opts.Duration <= env.MaxAttackDuration {
		origTarget.Opts.Duration = req.Target.Opts.Duration
	}
	if req.Target.Opts.RatePerSecond > 0 && req.Target.Opts.RatePerSecond <= env.MaxAttackRate {
		origTarget.Opts.RatePerSecond = req.Target.Opts.RatePerSecond
		origTarget.Opts.ratePerSecond = vegeta.Rate{
			Freq: req.Target.Opts.RatePerSecond,
			Per:  time.Second,
		}
	}
	if req.Target.Opts.Timeout > 0 && req.Target.Opts.Timeout <= DefaultAttackTimeout {
		origTarget.Opts.Timeout = req.Target.Opts.Timeout
	}
	if origHttpTarget.IsCustomizable {
		origHttpTarget.Method = req.HttpTarget.Method
		origHttpTarget.Path = req.HttpTarget.Path
		origHttpTarget.RequestType = req.HttpTarget.RequestType
	}

	outrr = &RunRequest{
		Target: *origTarget,
	}

	outrr.HttpTarget.clone(origHttpTarget)

	outrr.Target.Vars = req.Target.Vars
	outrr.HttpTarget.Headers = req.HttpTarget.Headers
	outrr.HttpTarget.Params = req.HttpTarget.Params
	outrr.HttpTarget.paramsToPath()

	return outrr
}

// generateWebSocketTarget merge the run request with original target and
// WebSocket target into new RunRequest
func generateWebSocketTarget(
	env *Environment,
	req *RunRequest,
	origTarget *Target,
	origWebSocketTarget *WebSocketTarget,
) (outrr *RunRequest) {
	if req.Target.Opts.Duration > 0 && req.Target.Opts.Duration <= env.MaxAttackDuration {
		origTarget.Opts.Duration = req.Target.Opts.Duration
	}
	if req.Target.Opts.RatePerSecond > 0 && req.Target.Opts.RatePerSecond <= env.MaxAttackRate {
		origTarget.Opts.RatePerSecond = req.Target.Opts.RatePerSecond
		origTarget.Opts.ratePerSecond = vegeta.Rate{
			Freq: req.Target.Opts.RatePerSecond,
			Per:  time.Second,
		}
	}
	if req.Target.Opts.Timeout > 0 && req.Target.Opts.Timeout <= DefaultAttackTimeout {
		origTarget.Opts.Timeout = req.Target.Opts.Timeout
	}

	outrr = &RunRequest{
		Target:          *origTarget,
		WebSocketTarget: *origWebSocketTarget,
	}
	outrr.Target.Vars = req.Target.Vars
	outrr.WebSocketTarget.Headers = req.WebSocketTarget.Headers
	outrr.WebSocketTarget.Params = req.WebSocketTarget.Params

	return outrr
}

func (rr *RunRequest) String() string {
	return fmt.Sprintf("Target:%v HttpTarget:%s\n", rr.Target, rr.HttpTarget.String())
}
