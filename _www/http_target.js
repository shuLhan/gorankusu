// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { WuiInputSelect } from "./wui/input/select.js";
import { WuiInputString } from "./wui/input/string.js";
import { generateFormInput, loadHttpTargetHeader, loadHttpTargetParam, } from "./functions.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, } from "./interface.js";
const CLASS_HTTP_TARGET = "http_target";
const CLASS_HTTP_TARGET_ACTIONS = "http_target_actions";
const CLASS_HTTP_TARGET_ATTACK_RESULT = "http_target_attack_result";
const CLASS_HTTP_TARGET_ATTACK_RESULT_ACTIONS = "http_target_attack_result_actions";
const CLASS_HTTP_TARGET_INPUT = "http_target_input";
const CLASS_HTTP_TARGET_INPUT_HEADER = "http_target_input_header";
const CLASS_HTTP_TARGET_INPUT_PARAMS = "http_target_input_params";
const CLASS_HTTP_TARGET_OUT_ATTACK = "http_target_out_attack";
const CLASS_HTTP_TARGET_OUT_MONO = "http_target_out_mono";
const CLASS_HTTP_TARGET_OUT_RUN = "http_target_out_run";
const CONTENT_TYPE_JSON = "application/json";
export class HttpTarget {
    constructor(trunks, target, opts) {
        this.trunks = trunks;
        this.target = target;
        this.opts = opts;
        this.el = document.createElement("div");
        this.elButtonRun = document.createElement("button");
        this.elButtonAttack = document.createElement("button");
        this.elRequestInput = document.createElement("div");
        this.elOutRequest = document.createElement("div");
        this.elOutResponse = document.createElement("div");
        this.elOutResponseBody = document.createElement("div");
        this.elOutAttack = document.createElement("fieldset");
        this.elOutAttackResults = document.createElement("div");
        this.el.id = opts.ID;
        this.el.classList.add(CLASS_HTTP_TARGET);
        const elTitle = document.createElement("h3");
        elTitle.innerText = opts.Name;
        this.el.appendChild(elTitle);
        this.generateActions(elTitle);
        this.generateHint(this.el);
        this.generateInput(this.el);
        this.generateOutput(this.el);
        this.generateOutputAttack(this.el);
    }
    generateActions(parent) {
        const elActions = document.createElement("span");
        elActions.classList.add(CLASS_HTTP_TARGET_ACTIONS);
        this.elButtonRun.innerText = "Run";
        this.elButtonRun.onclick = () => {
            this.onClickRun();
        };
        elActions.appendChild(this.elButtonRun);
        if (this.opts.AllowAttack) {
            this.elButtonAttack.innerText = "Attack";
            this.elButtonAttack.onclick = () => {
                this.onClickAttack();
            };
            elActions.appendChild(this.elButtonAttack);
        }
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
        this.elRequestInput.classList.add(CLASS_HTTP_TARGET_INPUT);
        this.generateRequestMethod(this.elRequestInput);
        this.generateRequestContentType(this.elRequestInput);
        this.generateRequestHeaders(this.elRequestInput);
        this.generateRequestParameters(this.elRequestInput);
        parent.appendChild(this.elRequestInput);
    }
    generateRequestMethod(parent) {
        const m = "" + this.opts.Method;
        const selectOpts = {
            label: "",
            name: "",
            options: {
                GET: {
                    value: "0",
                    selected: m === "0",
                },
                CONNECT: {
                    value: "1",
                    selected: m === "1",
                },
                DELETE: {
                    value: "2",
                    selected: m === "2",
                },
                HEAD: {
                    value: "3",
                    selected: m === "3",
                },
                OPTIONS: {
                    value: "4",
                    selected: m === "4",
                },
                PATCH: {
                    value: "5",
                    selected: m === "5",
                },
                POST: {
                    value: "6",
                    selected: m === "6",
                },
                PUT: {
                    value: "7",
                    selected: m === "7",
                },
                TRACE: {
                    value: "8",
                    selected: m === "8",
                },
            },
            is_disabled: !this.opts.IsCustomizable,
            onChangeHandler: (_, value) => {
                this.opts.Method = parseInt(value);
            },
        };
        const wuiRequestMethod = new WuiInputSelect(selectOpts);
        const pathOpts = {
            label: wuiRequestMethod.el,
            value: this.opts.Path,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_disabled: !this.opts.IsCustomizable,
            onChangeHandler: (path) => {
                this.opts.Path = path;
            },
        };
        const wuiRequestPath = new WuiInputString(pathOpts);
        parent.appendChild(wuiRequestPath.el);
    }
    generateRequestContentType(parent) {
        const ct = "" + this.opts.RequestType;
        const selectOpts = {
            label: "Content type",
            name: "",
            options: {
                "(none)": {
                    value: "0",
                    selected: ct === "0",
                },
                "(query)": {
                    value: "1",
                    selected: ct === "1",
                },
                "application/x-www-form-urlencoded": {
                    value: "2",
                    selected: ct === "2",
                },
                "multipart/form-data": {
                    value: "3",
                    selected: ct === "3",
                },
                "application/json": {
                    value: "4",
                    selected: ct === "4",
                },
            },
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_disabled: !this.opts.IsCustomizable,
            onChangeHandler: (_, value) => {
                this.opts.RequestType = parseInt(value);
            },
        };
        const wuiRequestType = new WuiInputSelect(selectOpts);
        parent.appendChild(wuiRequestType.el);
    }
    generateRequestHeaders(parent) {
        if (!this.opts.Headers) {
            return;
        }
        if (Object.keys(this.opts.Headers).length === 0) {
            return;
        }
        const wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_HEADER);
        const legend = document.createElement("legend");
        legend.innerText = "Headers";
        wrapper.appendChild(legend);
        for (const [key, fi] of Object.entries(this.opts.Headers)) {
            fi.value = loadHttpTargetHeader(this.target, this.opts, key);
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
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_PARAMS);
        const title = document.createElement("legend");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (const [key, fi] of Object.entries(this.opts.Params)) {
            fi.value = loadHttpTargetParam(this.target, this.opts, key);
            generateFormInput(wrapper, fi);
        }
        parent.appendChild(wrapper);
    }
    generateOutput(parent) {
        const wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_HTTP_TARGET_OUT_RUN);
        const title = document.createElement("legend");
        title.innerText = "Run output";
        const btnClear = document.createElement("button");
        btnClear.innerText = "Clear";
        btnClear.onclick = () => {
            this.onClickClearOutput();
        };
        title.appendChild(btnClear);
        this.elOutRequest.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
        this.elOutResponse.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
        this.elOutResponseBody.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
        wrapper.appendChild(title);
        wrapper.appendChild(this.elOutRequest);
        wrapper.appendChild(this.elOutResponse);
        wrapper.appendChild(this.elOutResponseBody);
        parent.appendChild(wrapper);
        this.onClickClearOutput();
    }
    generateOutputAttack(parent) {
        if (!this.opts.AllowAttack) {
            return;
        }
        this.elOutAttack.classList.add(CLASS_HTTP_TARGET_OUT_ATTACK);
        const title = document.createElement("legend");
        title.innerText = "Attack results";
        this.generateAttackResults(this.elOutAttackResults);
        this.elOutAttack.appendChild(title);
        this.elOutAttack.appendChild(this.elOutAttackResults);
        parent.appendChild(this.elOutAttack);
    }
    generateAttackResults(parent) {
        parent.innerText = "";
        if (!this.opts.Results) {
            return;
        }
        for (const result of this.opts.Results) {
            const wrapper = document.createElement("div");
            wrapper.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT);
            const elReportText = document.createElement("div");
            elReportText.style.display = "none";
            elReportText.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
            const elReportHist = document.createElement("div");
            elReportHist.style.display = "none";
            elReportHist.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
            const el = document.createElement("div");
            el.innerText = result.Name;
            const actions = document.createElement("span");
            actions.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT_ACTIONS);
            const btnAttackShow = document.createElement("button");
            btnAttackShow.innerText = "Show";
            btnAttackShow.onclick = () => {
                this.onClickAttackShow(result.Name, btnAttackShow, elReportText, elReportHist);
            };
            const btnAttackDel = document.createElement("button");
            btnAttackDel.innerText = "Delete";
            btnAttackDel.onclick = () => {
                this.onClickAttackDelete(result);
            };
            actions.appendChild(btnAttackShow);
            actions.appendChild(btnAttackDel);
            el.appendChild(actions);
            wrapper.appendChild(el);
            wrapper.appendChild(elReportText);
            wrapper.appendChild(elReportHist);
            parent.appendChild(wrapper);
        }
    }
    async onClickAttack() {
        await this.trunks.attackHttp(this.target, this.opts);
    }
    async onClickAttackDelete(result) {
        const res = await this.trunks.attackHttpDelete(result.Name);
        if (!res) {
            return;
        }
        this.opts.Results.forEach((r, x) => {
            if (r.Name == result.Name) {
                this.opts.Results.splice(x, 1);
                this.generateAttackResults(this.elOutAttackResults);
                return;
            }
        });
    }
    async onClickAttackShow(resultName, btn, elReportText, elReportHist) {
        if (btn.innerText === "Hide") {
            btn.innerText = "Show";
            elReportText.style.display = "none";
            elReportHist.style.display = "none";
            return;
        }
        const resJSON = await this.trunks.attackHttpGet(resultName);
        if (resJSON.code != 200) {
            return;
        }
        const res = resJSON.data;
        elReportText.innerText = atob(res.TextReport);
        elReportText.style.display = "block";
        elReportHist.innerText = atob(res.HistReport);
        elReportHist.style.display = "block";
        btn.innerText = "Hide";
    }
    async onClickClearOutput() {
        this.elOutRequest.innerText = "Raw request";
        this.elOutResponse.innerText = "Raw response";
        this.elOutResponseBody.innerText = "JSON formatted response body";
    }
    async onClickRun() {
        const res = await this.trunks.runHttp(this.target, this.opts);
        if (!res) {
            return;
        }
        this.elOutRequest.innerText = atob(res.DumpRequest);
        this.elOutResponse.innerText = atob(res.DumpResponse);
        const body = atob(res.ResponseBody);
        if (res.ResponseType === CONTENT_TYPE_JSON) {
            this.elOutResponseBody.innerText = JSON.stringify(JSON.parse(body), null, 2);
        }
        else {
            this.elOutResponseBody.innerText = body;
        }
    }
    AddAttackResult(result) {
        this.opts.Results.push(result);
        this.generateAttackResults(this.elOutAttackResults);
    }
}
