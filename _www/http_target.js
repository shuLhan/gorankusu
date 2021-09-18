var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CLASS_INPUT, CLASS_INPUT_LABEL, } from "./interface.js";
import { WuiInputSelect } from "./wui/input/select.js";
import { WuiInputString } from "./wui/input/string.js";
const CLASS_HTTP_TARGET = "http_target";
const CLASS_HTTP_TARGET_ACTIONS = "http_target_actions";
const CLASS_HTTP_TARGET_ATTACK_RESULT = "http_target_attack_result";
const CLASS_HTTP_TARGET_ATTACK_RESULT_ACTIONS = "http_target_attack_result_actions";
const CLASS_HTTP_TARGET_INPUT = "http_target_input";
const CLASS_HTTP_TARGET_INPUT_HEADER = "http_target_input_header";
const CLASS_HTTP_TARGET_INPUT_PARAMS = "http_target_input_header";
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
        this.el_out_request = document.createElement("pre");
        this.el_out_response = document.createElement("pre");
        this.el_out_response_body = document.createElement("pre");
        this.el_out_attack = document.createElement("div");
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
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_HEADER);
        let title = document.createElement("h4");
        title.innerText = "Headers";
        wrapper.appendChild(title);
        for (let key in this.opts.Headers) {
            let opts = {
                label: key,
                value: this.opts.Headers[key],
                class_input: CLASS_INPUT,
                class_label: CLASS_INPUT_LABEL,
                onChangeHandler: (new_value) => {
                    this.opts.Headers[key] = new_value;
                },
            };
            let wui_input_header = new WuiInputString(opts);
            wrapper.appendChild(wui_input_header.el);
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
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_PARAMS);
        let title = document.createElement("h4");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (let key in this.opts.Params) {
            let opts = {
                label: key,
                value: this.opts.Params[key],
                class_input: CLASS_INPUT,
                class_label: CLASS_INPUT_LABEL,
                onChangeHandler: (new_value) => {
                    this.opts.Params[key] = new_value;
                },
            };
            let wui_input_param = new WuiInputString(opts);
            wrapper.appendChild(wui_input_param.el);
        }
        parent.appendChild(wrapper);
    }
    generateOutput(parent) {
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_HTTP_TARGET_OUT_RUN);
        let title = document.createElement("h4");
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
    }
    generateOutputAttack(parent) {
        if (!this.opts.AllowAttack) {
            return;
        }
        this.el_out_attack.classList.add(CLASS_HTTP_TARGET_OUT_ATTACK);
        let title = document.createElement("h4");
        title.innerText = "Attack results";
        this.generateAttackResults(this.el_out_attack_results);
        this.el_out_attack.appendChild(title);
        this.el_out_attack.appendChild(this.el_out_attack_results);
        parent.appendChild(this.el_out_attack);
    }
    generateAttackResults(parent) {
        parent.innerText = "";
        for (let result of this.opts.Results) {
            let wrapper = document.createElement("div");
            wrapper.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT);
            let el_report_text = document.createElement("pre");
            el_report_text.style.display = "none";
            el_report_text.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
            let el_report_hist = document.createElement("pre");
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
            let res = yield this.trunks.AttackHttp(this.target, this.opts);
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
            this.el_out_request.innerText = "";
            this.el_out_response.innerText = "";
            this.el_out_response_body.innerText = "";
        });
    }
    onClickRun() {
        return __awaiter(this, void 0, void 0, function* () {
            let res_json = yield this.trunks.RunHttp(this.target, this.opts);
            if (res_json.code != 200) {
                return;
            }
            let res = res_json.data;
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF90YXJnZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwX3RhcmdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixHQU9qQixNQUFNLGdCQUFnQixDQUFBO0FBQ3ZCLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQTtBQUN2QyxNQUFNLHlCQUF5QixHQUFHLHFCQUFxQixDQUFBO0FBQ3ZELE1BQU0sK0JBQStCLEdBQUcsMkJBQTJCLENBQUE7QUFDbkUsTUFBTSx1Q0FBdUMsR0FDNUMsbUNBQW1DLENBQUE7QUFDcEMsTUFBTSx1QkFBdUIsR0FBRyxtQkFBbUIsQ0FBQTtBQUNuRCxNQUFNLDhCQUE4QixHQUFHLDBCQUEwQixDQUFBO0FBQ2pFLE1BQU0sOEJBQThCLEdBQUcsMEJBQTBCLENBQUE7QUFDakUsTUFBTSw0QkFBNEIsR0FBRyx3QkFBd0IsQ0FBQTtBQUM3RCxNQUFNLDBCQUEwQixHQUFHLHNCQUFzQixDQUFBO0FBQ3pELE1BQU0seUJBQXlCLEdBQUcscUJBQXFCLENBQUE7QUFFdkQsTUFBTSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQTtBQUU1QyxNQUFNLE9BQU8sVUFBVTtJQVd0QixZQUNRLE1BQXVCLEVBQ3ZCLE1BQXVCLEVBQ3ZCLElBQXlCO1FBRnpCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQ3ZCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQ3ZCLFNBQUksR0FBSixJQUFJLENBQXFCO1FBYmpDLE9BQUUsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxrQkFBYSxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ25FLHFCQUFn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