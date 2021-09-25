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
            let val = LoadWsTargetHeader(this.target, this.opts, key);
            GenerateFormInput(wrapper, fi, val);
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
        wrapper.classList.add(CLASS_WS_TARGET_INPUT_PARAM);
        let title = document.createElement("h4");
        title.innerText = "Parameters";
        wrapper.appendChild(title);
        for (let key in this.opts.Params) {
            let fi = this.opts.Params[key];
            let val = LoadWsTargetParam(this.target, this.opts, key);
            GenerateFormInput(wrapper, fi, val);
        }
        parent.appendChild(wrapper);
    }
    generateOutput(parent) {
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_WS_TARGET_OUT_RUN);
        let title = document.createElement("h4");
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
            this.el_out_response.innerText = JSON.stringify(JSON.parse(atob(res.data)), null, 2);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3NfdGFyZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid3NfdGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLE9BQU8sRUFDTixpQkFBaUIsRUFDakIsa0JBQWtCLEVBQ2xCLGlCQUFpQixHQUNqQixNQUFNLGdCQUFnQixDQUFBO0FBU3ZCLE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQTtBQUNuQyxNQUFNLHVCQUF1QixHQUFHLG1CQUFtQixDQUFBO0FBQ25ELE1BQU0scUJBQXFCLEdBQUcsaUJBQWlCLENBQUE7QUFDL0MsTUFBTSw0QkFBNEIsR0FBRyx3QkFBd0IsQ0FBQTtBQUM3RCxNQUFNLDJCQUEyQixHQUFHLHVCQUF1QixDQUFBO0FBQzNELE1BQU0sd0JBQXdCLEdBQUcsb0JBQW9CLENBQUE7QUFDckQsTUFBTSx1QkFBdUIsR0FBRyxtQkFBbUIsQ0FBQTtBQUVuRCxNQUFNLE9BQU8sZUFBZTtJQU0zQixZQUNRLE1BQXVCLEVBQ3ZCLE1BQXVCLEVBQ3ZCLElBQThCO1FBRjlCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQ3ZCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQ3ZCLFNBQUksR0FBSixJQUFJLENBQTBCO1FBUnRDLE9BQUUsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxrQkFBYSxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ25FLHFCQUFnQixHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzdELG9CQUFlLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFPM0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQTtRQUNwQixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUE7UUFFdEMs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