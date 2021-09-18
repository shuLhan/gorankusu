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
import { GenerateFormInput } from "./functions.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, } from "./interface.js";
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
            let fi = this.opts.Headers[key];
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
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_PARAMS);
        let title = document.createElement("h4");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (let key in this.opts.Params) {
            let fi = this.opts.Params[key];
            GenerateFormInput(wrapper, fi);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF90YXJnZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwX3RhcmdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSxPQUFPLEVBQUUsY0FBYyxFQUFzQixNQUFNLHVCQUF1QixDQUFBO0FBQzFFLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFFMUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFDbEQsT0FBTyxFQUNOLFdBQVcsRUFDWCxpQkFBaUIsR0FTakIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUV2QixNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQTtBQUN2QyxNQUFNLHlCQUF5QixHQUFHLHFCQUFxQixDQUFBO0FBQ3ZELE1BQU0sK0JBQStCLEdBQUcsMkJBQTJCLENBQUE7QUFDbkUsTUFBTSx1Q0FBdUMsR0FBRyxtQ0FBbUMsQ0FBQTtBQUNuRixNQUFNLHVCQUF1QixHQUFHLG1CQUFtQixDQUFBO0FBQ25ELE1BQU0sOEJBQThCLEdBQUcsMEJBQTBCLENBQUE7QUFDakUsTUFBTSw4QkFBOEIsR0FBRywwQkFBMEIsQ0FBQTtBQUNqRSxNQUFNLDRCQUE0QixHQUFHLHdCQUF3QixDQUFBO0FBQzdELE1BQU0sMEJBQTBCLEdBQUcsc0JBQXNCLENBQUE7QUFDekQsTUFBTSx5QkFBeUIsR0FBRyxxQkFBcUIsQ0FBQTtBQUV2RCxNQUFNLGlCQUFpQixHQUFHLGtCQUFrQixDQUFBO0FBRTVDLE1BQU0sT0FBTyxVQUFVO0lBV3RCLFlBQW1CLE1BQXVCLEVBQVMsTUFBdUIsRUFBUyxJQUF5QjtRQUF6RixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUFTLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQVMsU0FBSSxHQUFKLElBQUksQ0FBcUI7UUFWNUcsT0FBRSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQy9DLGtCQUFhLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDbkUscUJBQWdCLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDdEUscUJBQWdCLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDN0QsbUJBQWMsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMzRCxvQkFBZSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzVELHlCQUFvQixHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pFLGtCQUFhLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDMUQsMEJBQXFCLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFHakUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQTtRQUNwQixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUV4QyxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzNDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUU3QixJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzVCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbkMsQ0FBQztJQUVPLGVBQWUsQ0FBQyxNQUFtQjtRQUMxQyxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQy9DLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUE7UUFFbkQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO1FBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtZQUNqQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7UUFDbEIsQ0FBQyxDQUFBO1FBQ0QsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7UUFFMUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUMxQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQTtZQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQ3JCLENBQUMsQ0FBQTtZQUNELFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUE7U0FDN0M7UUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBQy9CLENBQUM7SUFFTyxZQUFZLENBQUMsTUFBbUI7UUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ3BCLE9BQU07U0FDTjtRQUNELElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFTyxhQUFhLENBQUMsTUFBbUI7UUFDeEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtRQUU1RCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUE7UUFDakQsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQ3RELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtRQUNsRCxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUE7UUFFckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBRU8scUJBQXFCLENBQUMsTUFBbUI7UUFDaEQsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLElBQUksV0FBVyxHQUF1QjtZQUNyQyxLQUFLLEVBQUUsRUFBRTtZQUNULElBQUksRUFBRSxFQUFFO1lBQ1IsT0FBTyxFQUFFO2dCQUNSLEdBQUcsRUFBRTtvQkFDSixLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELE9BQU8sRUFBRTtvQkFDUixLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELE1BQU0sRUFBRTtvQkFDUCxLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELElBQUksRUFBRTtvQkFDTCxLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELE9BQU8sRUFBRTtvQkFDUixLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELEtBQUssRUFBRTtvQkFDTixLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELElBQUksRUFBRTtvQkFDTCxLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELEdBQUcsRUFBRTtvQkFDSixLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2dCQUNELEtBQUssRUFBRTtvQkFDTixLQUFLLEVBQUUsR0FBRztvQkFDVixRQUFRLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQ25CO2FBQ0Q7WUFDRCxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWM7WUFDdEMsZUFBZSxFQUFFLENBQUMsR0FBVyxFQUFFLEtBQWEsRUFBRSxFQUFFO2dCQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbkMsQ0FBQztTQUNELENBQUE7UUFDRCxJQUFJLGtCQUFrQixHQUFHLElBQUksY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRXhELElBQUksU0FBUyxHQUF1QjtZQUNuQyxLQUFLLEVBQUUsa0JBQWtCLENBQUMsRUFBRTtZQUM1QixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO1lBQ3JCLFdBQVcsRUFBRSxXQUFXO1lBQ3hCLFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjO1lBQ3RDLGVBQWUsRUFBRSxDQUFDLElBQVksRUFBRSxFQUFFO2dCQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7WUFDdEIsQ0FBQztTQUNELENBQUE7UUFDRCxJQUFJLGdCQUFnQixHQUFHLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRXBELE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDeEMsQ0FBQztJQUVPLDBCQUEwQixDQUFDLE1BQW1CO1FBQ3JELElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQTtRQUNuQyxJQUFJLFdBQVcsR0FBdUI7WUFDckMsS0FBSyxFQUFFLGNBQWM7WUFDckIsSUFBSSxFQUFFLEVBQUU7WUFDUixPQUFPLEVBQUU7Z0JBQ1IsUUFBUSxFQUFFO29CQUNULEtBQUssRUFBRSxHQUFHO29CQUNWLFFBQVEsRUFBRSxFQUFFLEtBQUssR0FBRztpQkFDcEI7Z0JBQ0QsU0FBUyxFQUFFO29CQUNWLEtBQUssRUFBRSxHQUFHO29CQUNWLFFBQVEsRUFBRSxFQUFFLEtBQUssR0FBRztpQkFDcEI7Z0JBQ0QsbUNBQW1DLEVBQUU7b0JBQ3BDLEtBQUssRUFBRSxHQUFHO29CQUNWLFFBQVEsRUFBRSxFQUFFLEtBQUssR0FBRztpQkFDcEI7Z0JBQ0QscUJBQXFCLEVBQUU7b0JBQ3RCLEtBQUssRUFBRSxHQUFHO29CQUNWLFFBQVEsRUFBRSxFQUFFLEtBQUssR0FBRztpQkFDcEI7Z0JBQ0Qsa0JBQWtCLEVBQUU7b0JBQ25CLEtBQUssRUFBRSxHQUFHO29CQUNWLFFBQVEsRUFBRSxFQUFFLEtBQUssR0FBRztpQkFDcEI7YUFDRDtZQUNELFdBQVcsRUFBRSxXQUFXO1lBQ3hCLFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjO1lBQ3RDLGVBQWUsRUFBRSxDQUFDLEdBQVcsRUFBRSxLQUFhLEVBQUUsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3hDLENBQUM7U0FDRCxDQUFBO1FBQ0QsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUV0RCxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3hDLENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxNQUFtQjtRQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDdkIsT0FBTTtTQUNOO1FBQ0QsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNoRCxPQUFNO1NBQ047UUFFRCxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzNDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUE7UUFFckQsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4QyxLQUFLLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUMzQixPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRTFCLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDbEMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDL0IsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1NBQzlCO1FBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRU8seUJBQXlCLENBQUMsTUFBbUI7UUFDcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3RCLE9BQU07U0FDTjtRQUNELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDL0MsT0FBTTtTQUNOO1FBRUQsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMzQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFBO1FBRXJELElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDeEMsS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUE7UUFDOUIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUUxQixLQUFLLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2pDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzlCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtTQUM5QjtRQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVPLGNBQWMsQ0FBQyxNQUFtQjtRQUN6QyxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzNDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUE7UUFFaEQsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4QyxLQUFLLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQTtRQUU5QixJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2hELFNBQVMsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFBO1FBQzdCLFNBQVMsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1FBQzFCLENBQUMsQ0FBQTtRQUNELEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUE7UUFFNUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUE7UUFDN0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUE7UUFDOUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQTtRQUVuRSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzFCLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQ3hDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBQ3pDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFFOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRU8sb0JBQW9CLENBQUMsTUFBbUI7UUFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQzNCLE9BQU07U0FDTjtRQUVELElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFBO1FBRTlELElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDeEMsS0FBSyxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQTtRQUVsQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFFdEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDckMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7SUFDdkMsQ0FBQztJQUVPLHFCQUFxQixDQUFDLE1BQW1CO1FBQ2hELE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO1FBRXJCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDckMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUMzQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO1lBRXRELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbEQsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO1lBQ3JDLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUE7WUFFeEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNsRCxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7WUFDckMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQTtZQUV4RCxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3RDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQTtZQUUxQixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzVDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUE7WUFFOUQsSUFBSSxlQUFlLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUN0RCxlQUFlLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtZQUNsQyxlQUFlLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQTtZQUNyRixDQUFDLENBQUE7WUFFRCxJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ3JELGNBQWMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFBO1lBQ25DLGNBQWMsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFO2dCQUM3QixJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDakMsQ0FBQyxDQUFBO1lBRUQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUNwQyxPQUFPLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1lBQ25DLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFdkIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN2QixPQUFPLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1lBQ25DLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUE7WUFFbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUMzQjtJQUNGLENBQUM7SUFFYSxhQUFhOztZQUMxQixJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQy9ELENBQUM7S0FBQTtJQUVhLG1CQUFtQixDQUFDLE1BQXVCOztZQUN4RCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3pELElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1QsT0FBTTthQUNOO1lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDbEQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQzVCLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO29CQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUM5QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUE7b0JBQ3RELE9BQU07aUJBQ047YUFDRDtRQUNGLENBQUM7S0FBQTtJQUVhLGlCQUFpQixDQUM5QixXQUFtQixFQUNuQixHQUFzQixFQUN0QixjQUEyQixFQUMzQixjQUEyQjs7WUFFM0IsSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLE1BQU0sRUFBRTtnQkFDN0IsR0FBRyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7Z0JBQ3RCLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtnQkFDckMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO2dCQUNyQyxPQUFNO2FBQ047WUFFRCxJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQzNELElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7Z0JBQ3pCLE9BQU07YUFDTjtZQUVELElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUF1QixDQUFBO1lBRTFDLGNBQWMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUMvQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7WUFFdEMsY0FBYyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQy9DLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtZQUV0QyxHQUFHLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQTtRQUN2QixDQUFDO0tBQUE7SUFFYSxrQkFBa0I7O1lBQy9CLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7WUFDbkMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFDekMsQ0FBQztLQUFBO0lBRWEsVUFBVTs7WUFDdkIsSUFBSSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNoRSxJQUFJLFFBQVEsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFO2dCQUN6QixPQUFNO2FBQ047WUFFRCxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBNEIsQ0FBQTtZQUMvQyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ3JELElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDdkQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUNqQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEtBQUssaUJBQWlCLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTthQUMvRTtpQkFBTTtnQkFDTixJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTthQUMxQztRQUNGLENBQUM7S0FBQTtDQUNEIn0=