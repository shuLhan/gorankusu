// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { WuiInputSelect } from "./wui/input/select.js";
import { WuiInputString } from "./wui/input/string.js";
import { GenerateFormInput, LoadHttpTargetHeader, LoadHttpTargetParam, } from "./functions.js";
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
        this.el_button_run = document.createElement("button");
        this.el_button_attack = document.createElement("button");
        this.el_request_input = document.createElement("div");
        this.el_out_request = document.createElement("div");
        this.el_out_response = document.createElement("div");
        this.el_out_response_body = document.createElement("div");
        this.el_out_attack = document.createElement("fieldset");
        this.el_out_attack_results = document.createElement("div");
        this.el.id = opts.ID;
        this.el.classList.add(CLASS_HTTP_TARGET);
        let el_title = document.createElement("h3");
        el_title.innerText = opts.Name;
        this.el.appendChild(el_title);
        this.generateActions(el_title);
        this.generateHint(this.el);
        this.generateInput(this.el);
        this.generateOutput(this.el);
        this.generateOutputAttack(this.el);
    }
    generateActions(parent) {
        let el_actions = document.createElement("span");
        el_actions.classList.add(CLASS_HTTP_TARGET_ACTIONS);
        this.el_button_run.innerText = "Run";
        this.el_button_run.onclick = () => {
            this.onClickRun();
        };
        el_actions.appendChild(this.el_button_run);
        if (this.opts.AllowAttack) {
            this.el_button_attack.innerText = "Attack";
            this.el_button_attack.onclick = () => {
                this.onClickAttack();
            };
            el_actions.appendChild(this.el_button_attack);
        }
        parent.appendChild(el_actions);
    }
    generateHint(parent) {
        if (!this.opts.Hint) {
            return;
        }
        let el_hint = document.createElement("p");
        el_hint.innerHTML = this.opts.Hint;
        parent.appendChild(el_hint);
    }
    generateInput(parent) {
        this.el_request_input.classList.add(CLASS_HTTP_TARGET_INPUT);
        this.generateRequestMethod(this.el_request_input);
        this.generateRequestContentType(this.el_request_input);
        this.generateRequestHeaders(this.el_request_input);
        this.generateRequestParameters(this.el_request_input);
        parent.appendChild(this.el_request_input);
    }
    generateRequestMethod(parent) {
        let m = "" + this.opts.Method;
        let select_opts = {
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
            onChangeHandler: (key, value) => {
                this.opts.Method = parseInt(value);
            },
        };
        let wui_request_method = new WuiInputSelect(select_opts);
        let path_opts = {
            label: wui_request_method.el,
            value: this.opts.Path,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_disabled: !this.opts.IsCustomizable,
            onChangeHandler: (path) => {
                this.opts.Path = path;
            },
        };
        let wui_request_path = new WuiInputString(path_opts);
        parent.appendChild(wui_request_path.el);
    }
    generateRequestContentType(parent) {
        let ct = "" + this.opts.RequestType;
        let select_opts = {
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
            onChangeHandler: (key, value) => {
                this.opts.RequestType = parseInt(value);
            },
        };
        let wui_request_type = new WuiInputSelect(select_opts);
        parent.appendChild(wui_request_type.el);
    }
    generateRequestHeaders(parent) {
        if (!this.opts.Headers) {
            return;
        }
        if (Object.keys(this.opts.Headers).length === 0) {
            return;
        }
        let wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_HEADER);
        let legend = document.createElement("legend");
        legend.innerText = "Headers";
        wrapper.appendChild(legend);
        for (let key in this.opts.Headers) {
            let fi = this.opts.Headers[key];
            fi.value = LoadHttpTargetHeader(this.target, this.opts, key);
            GenerateFormInput(wrapper, fi);
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
        let wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_PARAMS);
        let title = document.createElement("legend");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (let key in this.opts.Params) {
            let fi = this.opts.Params[key];
            fi.value = LoadHttpTargetParam(this.target, this.opts, key);
            GenerateFormInput(wrapper, fi);
        }
        parent.appendChild(wrapper);
    }
    generateOutput(parent) {
        let wrapper = document.createElement("fieldset");
        wrapper.classList.add(CLASS_HTTP_TARGET_OUT_RUN);
        let title = document.createElement("legend");
        title.innerText = "Run output";
        let btn_clear = document.createElement("button");
        btn_clear.innerText = "Clear";
        btn_clear.onclick = () => {
            this.onClickClearOutput();
        };
        title.appendChild(btn_clear);
        this.el_out_request.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
        this.el_out_response.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
        this.el_out_response_body.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
        wrapper.appendChild(title);
        wrapper.appendChild(this.el_out_request);
        wrapper.appendChild(this.el_out_response);
        wrapper.appendChild(this.el_out_response_body);
        parent.appendChild(wrapper);
        this.onClickClearOutput();
    }
    generateOutputAttack(parent) {
        if (!this.opts.AllowAttack) {
            return;
        }
        this.el_out_attack.classList.add(CLASS_HTTP_TARGET_OUT_ATTACK);
        let title = document.createElement("legend");
        title.innerText = "Attack results";
        this.generateAttackResults(this.el_out_attack_results);
        this.el_out_attack.appendChild(title);
        this.el_out_attack.appendChild(this.el_out_attack_results);
        parent.appendChild(this.el_out_attack);
    }
    generateAttackResults(parent) {
        parent.innerText = "";
        if (!this.opts.Results) {
            return;
        }
        for (let result of this.opts.Results) {
            let wrapper = document.createElement("div");
            wrapper.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT);
            let el_report_text = document.createElement("div");
            el_report_text.style.display = "none";
            el_report_text.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
            let el_report_hist = document.createElement("div");
            el_report_hist.style.display = "none";
            el_report_hist.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
            let el = document.createElement("div");
            el.innerText = result.Name;
            let actions = document.createElement("span");
            actions.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT_ACTIONS);
            let btn_attack_show = document.createElement("button");
            btn_attack_show.innerText = "Show";
            btn_attack_show.onclick = () => {
                this.onClickAttackShow(result.Name, btn_attack_show, el_report_text, el_report_hist);
            };
            let btn_attack_del = document.createElement("button");
            btn_attack_del.innerText = "Delete";
            btn_attack_del.onclick = () => {
                this.onClickAttackDelete(result);
            };
            actions.appendChild(btn_attack_show);
            actions.appendChild(btn_attack_del);
            el.appendChild(actions);
            wrapper.appendChild(el);
            wrapper.appendChild(el_report_text);
            wrapper.appendChild(el_report_hist);
            parent.appendChild(wrapper);
        }
    }
    onClickAttack() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.trunks.AttackHttp(this.target, this.opts);
        });
    }
    onClickAttackDelete(result) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.trunks.AttackHttpDelete(result.Name);
            if (!res) {
                return;
            }
            for (let x = 0; x < this.opts.Results.length; x++) {
                let r = this.opts.Results[x];
                if (r.Name == result.Name) {
                    this.opts.Results.splice(x, 1);
                    this.generateAttackResults(this.el_out_attack_results);
                    return;
                }
            }
        });
    }
    onClickAttackShow(result_name, btn, el_report_text, el_report_hist) {
        return __awaiter(this, void 0, void 0, function* () {
            if (btn.innerText === "Hide") {
                btn.innerText = "Show";
                el_report_text.style.display = "none";
                el_report_hist.style.display = "none";
                return;
            }
            let res_json = yield this.trunks.AttackHttpGet(result_name);
            if (res_json.code != 200) {
                return;
            }
            let res = res_json.data;
            el_report_text.innerText = atob(res.TextReport);
            el_report_text.style.display = "block";
            el_report_hist.innerText = atob(res.HistReport);
            el_report_hist.style.display = "block";
            btn.innerText = "Hide";
        });
    }
    onClickClearOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            this.el_out_request.innerText = "Raw request";
            this.el_out_response.innerText = "Raw response";
            this.el_out_response_body.innerText =
                "JSON formatted response body";
        });
    }
    onClickRun() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.trunks.RunHttp(this.target, this.opts);
            if (!res) {
                return;
            }
            this.el_out_request.innerText = atob(res.DumpRequest);
            this.el_out_response.innerText = atob(res.DumpResponse);
            let body = atob(res.ResponseBody);
            if (res.ResponseType === CONTENT_TYPE_JSON) {
                this.el_out_response_body.innerText = JSON.stringify(JSON.parse(body), null, 2);
            }
            else {
                this.el_out_response_body.innerText = body;
            }
        });
    }
    AddAttackResult(result) {
        this.opts.Results.push(result);
        this.generateAttackResults(this.el_out_attack_results);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF90YXJnZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwX3RhcmdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw0REFBNEQ7QUFDNUQsNENBQTRDOzs7Ozs7Ozs7O0FBRzVDLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQ04saUJBQWlCLEVBQ2pCLG9CQUFvQixFQUNwQixtQkFBbUIsR0FDbkIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUN2QixPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixHQVFqQixNQUFNLGdCQUFnQixDQUFBO0FBRXZCLE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFBO0FBQ3ZDLE1BQU0seUJBQXlCLEdBQUcscUJBQXFCLENBQUE7QUFDdkQsTUFBTSwrQkFBK0IsR0FBRywyQkFBMkIsQ0FBQTtBQUNuRSxNQUFNLHVDQUF1QyxHQUM1QyxtQ0FBbUMsQ0FBQTtBQUNwQyxNQUFNLHVCQUF1QixHQUFHLG1CQUFtQixDQUFBO0FBQ25ELE1BQU0sOEJBQThCLEdBQUcsMEJBQTBCLENBQUE7QUFDakUsTUFBTSw4QkFBOEIsR0FBRywwQkFBMEIsQ0FBQTtBQUNqRSxNQUFNLDRCQUE0QixHQUFHLHdCQUF3QixDQUFBO0FBQzdELE1BQU0sMEJBQTBCLEdBQUcsc0JBQXNCLENBQUE7QUFDekQsTUFBTSx5QkFBeUIsR0FBRyxxQkFBcUIsQ0FBQTtBQUV2RCxNQUFNLGlCQUFpQixHQUFHLGtCQUFrQixDQUFBO0FBRTVDLE1BQU0sT0FBTyxVQUFVO0lBV3RCLFlBQ1EsTUFBdUIsRUFDdkIsTUFBdUIsRUFDdkIsSUFBeUI7UUFGekIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsU0FBSSxHQUFKLElBQUksQ0FBcUI7UUFiakMsT0FBRSxHQUFnQixR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