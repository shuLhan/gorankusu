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
import { GenerateFormInput, LoadWsTargetHeader, LoadWsTargetParam, } from "./functions.js";
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
        let el_title = document.createElement("h3");
        el_title.innerText = opts.Name;
        this.el.appendChild(el_title);
        this.generateActions(el_title);
        this.generateHint(this.el);
        this.generateInput(this.el);
        this.generateOutput(this.el);
    }
    generateActions(parent) {
        let el_actions = document.createElement("span");
        el_actions.classList.add(CLASS_WS_TARGET_ACTIONS);
        this.el_button_run.innerText = "Run";
        this.el_button_run.onclick = () => {
            this.onClickRun();
        };
        el_actions.appendChild(this.el_button_run);
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
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_WS_TARGET_INPUT_HEADER);
        let title = document.createElement("h4");
        title.innerText = "Headers";
        wrapper.appendChild(title);
        for (let key in this.opts.Headers) {
            let fi = this.opts.Headers[key];
            fi.value = LoadWsTargetHeader(this.target, this.opts, key);
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
        wrapper.classList.add(CLASS_WS_TARGET_INPUT_PARAM);
        let title = document.createElement("legend");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (let key in this.opts.Params) {
            let fi = this.opts.Params[key];
            fi.value = LoadWsTargetParam(this.target, this.opts, key);
            GenerateFormInput(wrapper, fi);
        }
        parent.appendChild(wrapper);
    }
    generateOutput(parent) {
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
    onClickClearOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            this.el_out_response.innerText = "";
        });
    }
    onClickRun() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.trunks.RunWebSocket(this.target, this.opts);
            if (!res) {
                return;
            }
            this.el_out_response.innerText = JSON.stringify(res.data, null, 2);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3NfdGFyZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid3NfdGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDREQUE0RDtBQUM1RCw0Q0FBNEM7Ozs7Ozs7Ozs7QUFHNUMsT0FBTyxFQUNOLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsaUJBQWlCLEdBQ2pCLE1BQU0sZ0JBQWdCLENBQUE7QUFTdkIsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFBO0FBQ25DLE1BQU0sdUJBQXVCLEdBQUcsbUJBQW1CLENBQUE7QUFDbkQsTUFBTSxxQkFBcUIsR0FBRyxpQkFBaUIsQ0FBQTtBQUMvQyxNQUFNLDRCQUE0QixHQUFHLHdCQUF3QixDQUFBO0FBQzdELE1BQU0sMkJBQTJCLEdBQUcsdUJBQXVCLENBQUE7QUFDM0QsTUFBTSx3QkFBd0IsR0FBRyxvQkFBb0IsQ0FBQTtBQUNyRCxNQUFNLHVCQUF1QixHQUFHLG1CQUFtQixDQUFBO0FBRW5ELE1BQU0sT0FBTyxlQUFlO0lBTTNCLFlBQ1EsTUFBdUIsRUFDdkIsTUFBdUIsRUFDdkIsSUFBOEI7UUFGOUIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsU0FBSSxHQUFKLElBQUksQ0FBMEI7UUFSdEMsT0FBRSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQy9DLGtCQUFhLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDbkUscUJBQWdCLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDN0Qsb0JBQWUsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQU8zRCxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcs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