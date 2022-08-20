// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package trunks

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	liberrors "github.com/shuLhan/share/lib/errors"
	"github.com/shuLhan/share/lib/websocket"
)

func (trunks *Trunks) wsBroadcastAttackFinish(result *AttackResult) {
	if result == nil {
		return
	}

	logp := "wsBroadcastAttackFinish"

	jsonb, err := json.Marshal(result)
	if err != nil {
		log.Printf("%s: %s", logp, err)
		return
	}

	packet, err := websocket.NewBroadcast(
		apiAttackResult,
		base64.StdEncoding.EncodeToString(jsonb),
	)
	if err != nil {
		log.Printf("%s: %s", logp, err)
		return
	}

	for _, conn := range trunks.Wsd.Clients.All() {
		err = websocket.Send(conn, packet)
		if err != nil {
			log.Printf("%s: %s", logp, err)
		}
	}
}

func (trunks *Trunks) initWebSocketServer() (err error) {
	opts := &websocket.ServerOptions{
		Address: trunks.Env.websocketListenAddress,
	}

	trunks.Wsd = websocket.NewServer(opts)

	err = trunks.Wsd.RegisterTextHandler(
		"POST",
		apiAttackHttp,
		trunks.handleWsAttackHttp,
	)
	if err != nil {
		return err
	}

	err = trunks.Wsd.RegisterTextHandler(
		"DELETE",
		apiAttackHttp,
		trunks.handleWsAttackHttpCancel,
	)
	if err != nil {
		return err
	}

	return nil
}

func (trunks *Trunks) handleWsAttackHttp(
	ctx context.Context,
	req *websocket.Request,
) (res websocket.Response) {
	logp := "handleWsAttackHttp"

	reqBody, err := base64.StdEncoding.DecodeString(req.Body)
	if err != nil {
		return handleError(logp, err)
	}

	runRequest := &RunRequest{}
	err = json.Unmarshal(reqBody, runRequest)
	if err != nil {
		return handleError(logp, err)
	}

	err = trunks.AttackHttp(runRequest)
	if err != nil {
		return handleError(logp, err)
	}

	res.Code = http.StatusOK

	return res
}

func (trunks *Trunks) handleWsAttackHttpCancel(
	ctx context.Context,
	req *websocket.Request,
) (res websocket.Response) {
	logp := "handleWsAttackHttpCancel"

	rr, err := trunks.AttackHttpCancel()
	if err != nil {
		return handleError(logp, err)
	}

	jsonb, err := json.Marshal(rr)
	if err != nil {
		return handleError(logp, err)
	}

	res.Code = http.StatusOK
	res.Message = fmt.Sprintf(`Attack on target "%s / %s" has been canceled`,
		rr.Target.Name, rr.HttpTarget.Name)
	res.Body = base64.StdEncoding.EncodeToString(jsonb)

	return res
}

func handleError(logp string, err error) (res websocket.Response) {
	e := &liberrors.E{}
	if errors.As(err, &e) {
		res.Code = int32(e.Code)
		res.Message = e.Message
		return res
	}
	res.Code = http.StatusInternalServerError
	res.Message = fmt.Sprintf("%s: %s", logp, err)
	return res
}
