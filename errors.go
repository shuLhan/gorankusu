// Copyright 2021, Shulhan <ms@kilabit.info>. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package trunks

import (
	"fmt"
	"net/http"

	liberrors "github.com/shuLhan/share/lib/errors"
	libhttp "github.com/shuLhan/share/lib/http"
)

func errAttackConflict(ltr *loadTestingResult) error {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code:    http.StatusConflict,
			Message: "another attack is already running",
			Name:    "ERR_ATTACK_CONFLICT",
		},
		Data: ltr,
	}
	return res
}

func errAttackNotAllowed() error {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code:    http.StatusNotAcceptable,
			Message: "attack is not allowed",
			Name:    "ERR_ATTACK_NOT_ALLOWED",
		},
	}
	return res
}

func errInternal(err error) error {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
			Name:    "ERR_INTERNAL",
		},
	}
	return res
}

func errInvalidTarget(id string) error {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code:    http.StatusBadRequest,
			Message: fmt.Sprintf("invalid or emtpy Target.ID: %q", id),
			Name:    "ERR_INVALID_TARGET",
		},
	}
	return res
}

func errInvalidHttpTarget(id string) error {
	res := &libhttp.EndpointResponse{
		E: liberrors.E{
			Code:    http.StatusBadRequest,
			Message: fmt.Sprintf("invalid or emtpy HttpTarget.ID: %q", id),
			Name:    "ERR_INVALID_HTTP_TARGET",
		},
	}
	return res
}
