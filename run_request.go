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
	HTTPTarget      HTTPTarget
}

// generateRunRequest merge the run request with original target and HTTP
// target into new RunRequest.
func generateRunRequest(
	env *Environment,
	req *RunRequest,
	origTarget *Target,
	origHTTPTarget *HTTPTarget,
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
	if origHTTPTarget.IsCustomizable {
		origHTTPTarget.Method = req.HTTPTarget.Method
		origHTTPTarget.Path = req.HTTPTarget.Path
		origHTTPTarget.RequestType = req.HTTPTarget.RequestType
	}

	outrr = &RunRequest{
		Target: *origTarget,
	}

	outrr.HTTPTarget.clone(origHTTPTarget)

	outrr.Target.Vars = req.Target.Vars
	outrr.HTTPTarget.Headers = req.HTTPTarget.Headers
	outrr.HTTPTarget.Params = req.HTTPTarget.Params
	outrr.HTTPTarget.paramsToPath()

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
	return fmt.Sprintf(`Target:%v HTTPTarget:%s`, rr.Target, rr.HTTPTarget.String())
}
