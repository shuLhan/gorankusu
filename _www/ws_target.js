// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { generateFormInput, loadWsTargetHeader, loadWsTargetParam, } from "./functions.js";
const CLASS_WS_TARGET = "ws_target";
const CLASS_WS_TARGET_ACTIONS = "ws_target_actions";
const CLASS_WS_TARGET_INPUT = "ws_target_input";
const CLASS_WS_TARGET_INPUT_HEADER = "ws_target_input_header";
const CLASS_WS_TARGET_INPUT_PARAM = "ws_target_input_param";
const CLASS_WS_TARGET_OUT_MONO = "ws_target_out_mono";
const CLASS_WS_TARGET_OUT_RUN = "ws_target_out_run";
export class WebSocketTarget {
    constructor(trunks, target, opts) {
        this.trunks = trunks;
        this.target = target;
        this.opts = opts;
        this.el = document.createElement("div");
        this.el_button_run = document.createElement("button");
        this.el_request_input = document.createElement("div");
        this.el_out_response = document.createElement("pre");
        this.el.id = opts.ID;
        this.el.classList.add(CLASS_WS_TARGET);
        const elTitle = document.createElement("h3");
        elTitle.innerText = opts.Name;
        this.el.appendChild(elTitle);
        this.generateActions(elTitle);
        this.generateHint(this.el);
        this.generateInput(this.el);
        this.generateOutput(this.el);
    }
    generateActions(parent) {
        const elActions = document.createElement("span");
        elActions.classList.add(CLASS_WS_TARGET_ACTIONS);
        this.el_button_run.innerText = "Run";
        this.el_button_run.onclick = () => {
            this.onClickRun();
        };
        elActions.appendChild(this.el_button_run);
        parent.appendChild(elActions);
    }
    generateHint(parent) {
        if (!this.opts.Hint) {
            return;
        }
        const elHint = document.createElement("p");
        elHint.innerHTML = this.opts.Hint;
        parent.appendChild(elHint);
    }
    generateInput(parent) {
        this.el_request_input.classList.add(CLASS_WS_TARGET_INPUT);
        this.generateRequestHeaders(this.el_request_input);
        this.generateRequestParameters(this.el_request_input);
        parent.appendChild(this.el_request_input);
    }
    generateRequestHeaders(parent) {
        if (!this.opts.Headers) {
            return;
        }
        if (Object.keys(this.opts.Headers).length === 0) {
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_WS_TARGET_INPUT_HEADER);
        const title = document.createElement("h4");
        title.innerText = "Headers";
        wrapper.appendChild(title);
        for (const [key, fi] of Object.entries(this.opts.Headers)) {
            fi.value = loadWsTargetHeader(this.target, this.opts, key);
            generateFormInput(wrapper, fi);
        }
        parent.appendChild(wrapper);
    }
    generateRequestParameters(parent) {
        if (!this.opts.Params) {
            return;
        }
        if (Object.keys(this.opts.Params).length === 0) {
            return;
        }
        const wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_WS_TARGET_INPUT_PARAM);
        const title = document.createElement("legend");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (const [key, fi] of Object.entries(this.opts.Params)) {
            fi.value = loadWsTargetParam(this.target, this.opts, key);
            generateFormInput(wrapper, fi);
        }
        parent.appendChild(wrapper);
    }
    generateOutput(parent) {
        const wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_WS_TARGET_OUT_RUN);
        const title = document.createElement("legend");
        title.innerText = "Run output";
        const btnClear = document.createElement("button");
        btnClear.innerText = "Clear";
        btnClear.onclick = () => {
            this.onClickClearOutput();
        };
        title.appendChild(btnClear);
        this.el_out_response.classList.add(CLASS_WS_TARGET_OUT_MONO);
        wrapper.appendChild(title);
        wrapper.appendChild(this.el_out_response);
        parent.appendChild(wrapper);
    }
    async onClickClearOutput() {
        this.el_out_response.innerText = "";
    }
    async onClickRun() {
        const res = await this.trunks.runWebSocket(this.target, this.opts);
        if (!res) {
            return;
        }
        this.el_out_response.innerText = JSON.stringify(res.data, null, 2);
    }
}
