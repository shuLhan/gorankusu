// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  GenerateFormInput,
  LoadWsTargetHeader,
  LoadWsTargetParam,
} from "./functions.js";
import {
  TargetInterface,
  TrunksInterface,
  WebSocketTargetInterface,
} from "./interface.js";

const CLASS_WS_TARGET = "ws_target";
const CLASS_WS_TARGET_ACTIONS = "ws_target_actions";
const CLASS_WS_TARGET_INPUT = "ws_target_input";
const CLASS_WS_TARGET_INPUT_HEADER = "ws_target_input_header";
const CLASS_WS_TARGET_INPUT_PARAM = "ws_target_input_param";
const CLASS_WS_TARGET_OUT_MONO = "ws_target_out_mono";
const CLASS_WS_TARGET_OUT_RUN = "ws_target_out_run";

export class WebSocketTarget {
  el: HTMLElement = document.createElement("div");
  el_button_run: HTMLButtonElement = document.createElement("button");
  el_request_input: HTMLElement = document.createElement("div");
  el_out_response: HTMLElement = document.createElement("pre");

  constructor(
    public trunks: TrunksInterface,
    public target: TargetInterface,
    public opts: WebSocketTargetInterface,
  ) {
    this.el.id = opts.ID;
    this.el.classList.add(CLASS_WS_TARGET);

    let el_title = document.createElement("h3");
    el_title.innerText = opts.Name;
    this.el.appendChild(el_title);

    this.generateActions(el_title);
    this.generateHint(this.el);
    this.generateInput(this.el);
    this.generateOutput(this.el);
  }

  private generateActions(parent: HTMLElement) {
    let el_actions = document.createElement("span");
    el_actions.classList.add(CLASS_WS_TARGET_ACTIONS);

    this.el_button_run.innerText = "Run";
    this.el_button_run.onclick = () => {
      this.onClickRun();
    };
    el_actions.appendChild(this.el_button_run);

    parent.appendChild(el_actions);
  }

  private generateHint(parent: HTMLElement) {
    if (!this.opts.Hint) {
      return;
    }
    let el_hint = document.createElement("p");
    el_hint.innerHTML = this.opts.Hint;
    parent.appendChild(el_hint);
  }

  private generateInput(parent: HTMLElement) {
    this.el_request_input.classList.add(CLASS_WS_TARGET_INPUT);

    this.generateRequestHeaders(this.el_request_input);
    this.generateRequestParameters(this.el_request_input);

    parent.appendChild(this.el_request_input);
  }

  private generateRequestHeaders(parent: HTMLElement) {
    if (!this.opts.Headers) {
      return;
    }
    if (Object.keys(this.opts.Headers).length === 0) {
      return;
    }

    let wrapper = document.createElement("div");
    wrapper.classList.add(CLASS_WS_TARGET_INPUT_HEADER);

    let title = document.createElement("h4");
    title.innerText = "Headers";
    wrapper.appendChild(title);

    for (const [key, fi] of Object.entries(this.opts.Headers)) {
      fi.value = LoadWsTargetHeader(this.target, this.opts, key);
      GenerateFormInput(wrapper, fi);
    }

    parent.appendChild(wrapper);
  }

  private generateRequestParameters(parent: HTMLElement) {
    if (!this.opts.Params) {
      return;
    }
    if (Object.keys(this.opts.Params).length === 0) {
      return;
    }

    let wrapper = document.createElement("fieldset");
    wrapper.classList.add(CLASS_WS_TARGET_INPUT_PARAM);

    let title = document.createElement("legend");
    title.innerText = "Parameters";
    wrapper.appendChild(title);

    for (const [key, fi] of Object.entries(this.opts.Params)) {
      fi.value = LoadWsTargetParam(this.target, this.opts, key);
      GenerateFormInput(wrapper, fi);
    }

    parent.appendChild(wrapper);
  }

  private generateOutput(parent: HTMLElement) {
    let wrapper = document.createElement("fieldset");
    wrapper.classList.add(CLASS_WS_TARGET_OUT_RUN);

    let title = document.createElement("legend");
    title.innerText = "Run output";

    let btn_clear = document.createElement("button");
    btn_clear.innerText = "Clear";
    btn_clear.onclick = () => {
      this.onClickClearOutput();
    };
    title.appendChild(btn_clear);

    this.el_out_response.classList.add(CLASS_WS_TARGET_OUT_MONO);

    wrapper.appendChild(title);
    wrapper.appendChild(this.el_out_response);

    parent.appendChild(wrapper);
  }

  private async onClickClearOutput() {
    this.el_out_response.innerText = "";
  }

  private async onClickRun() {
    let res = await this.trunks.RunWebSocket(this.target, this.opts);
    if (!res) {
      return;
    }
    this.el_out_response.innerText = JSON.stringify(res.data, null, 2);
  }
}
