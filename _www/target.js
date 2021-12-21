import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { GenerateFormInput, LoadTargetOptDuration, LoadTargetOptRatePerSecond, LoadTargetOptTimeout, LoadTargetVar, } from "./functions.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, CLASS_NAV_TARGET, } from "./interface.js";
import { HttpTarget } from "./http_target.js";
import { WebSocketTarget } from "./ws_target.js";
const CLASS_NAV_TARGET_HTTP = "nav_http_target";
const CLASS_NAV_TARGET_WS = "nav_ws_target";
export class Target {
    constructor(trunks, opts) {
        this.trunks = trunks;
        this.opts = opts;
        this.el_nav = document.createElement("div");
        this.el_content = document.createElement("div");
        this.http_targets = {};
        this.ws_targets = {};
        this.generateNav(trunks);
        this.generateContent(trunks);
    }
    generateNav(trunks) {
        this.el_nav.classList.add(CLASS_NAV_TARGET);
        let el_target_menu = document.createElement("h3");
        el_target_menu.innerHTML = this.opts.Name;
        el_target_menu.onclick = () => {
            trunks.ContentRenderer(this.opts, null, null, null, this.el_content);
        };
        this.el_nav.appendChild(el_target_menu);
        if (this.opts.HttpTargets) {
            for (let ht of this.opts.HttpTargets) {
                let el_target_http = document.createElement("div");
                el_target_http.innerHTML = ht.Name;
                el_target_http.id = `/http/${this.opts.ID}/${ht.ID}`;
                el_target_http.classList.add(CLASS_NAV_TARGET_HTTP);
                el_target_http.onclick = () => {
                    trunks.ContentRenderer(this.opts, ht, null, null, this.el_content);
                };
                this.el_nav.appendChild(el_target_http);
            }
        }
        if (this.opts.WebSocketTargets) {
            for (let wst of this.opts.WebSocketTargets) {
                let el_target_ws = document.createElement("div");
                el_target_ws.innerHTML = wst.Name;
                el_target_ws.id = `/ws/${this.opts.ID}/${wst.ID}`;
                el_target_ws.classList.add(CLASS_NAV_TARGET_WS);
                el_target_ws.onclick = () => {
                    trunks.ContentRenderer(this.opts, null, wst, null, this.el_content);
                };
                this.el_nav.appendChild(el_target_ws);
            }
        }
    }
    generateContent(trunks) {
        this.generateContentBaseURL();
        this.generateContentAttackOptions();
        this.generateContentVars();
        this.generateHttpTargets(trunks);
        this.generateWebSocketTargets(trunks);
    }
    generateContentBaseURL() {
        let hdr_target = document.createElement("h2");
        hdr_target.innerText = this.opts.Name;
        hdr_target.id = this.opts.ID;
        let el_hint = document.createElement("p");
        el_hint.innerHTML = this.opts.Hint || "";
        let opts_base_url = {
            label: "Base URL",
            hint: "The base URL where the HTTP request will be send or the target of attack.",
            value: this.opts.BaseUrl,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            is_disabled: true,
            onChangeHandler: (v) => {
                this.opts.BaseUrl = v;
            },
        };
        let com_input_base_url = new WuiInputString(opts_base_url);
        this.el_content.appendChild(hdr_target);
        if (this.opts.Hint) {
            this.el_content.appendChild(el_hint);
        }
        this.el_content.appendChild(com_input_base_url.el);
    }
    generateContentAttackOptions() {
        let wrapper = document.createElement("fieldset");
        let legend = document.createElement("legend");
        legend.innerText = "Attack options";
        let opts_duration = {
            label: "Duration",
            hint: "The duration of attack, in seconds.",
            value: LoadTargetOptDuration(this.opts),
            min: 1,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.Opts.Duration = v * 1e9;
            },
        };
        let com_input_duration = new WuiInputNumber(opts_duration);
        let opts_rate = {
            label: "Rate per second",
            hint: "The number of request send per second when attacking target.",
            value: LoadTargetOptRatePerSecond(this.opts),
            min: 1,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.Opts.RatePerSecond = v;
            },
        };
        let com_input_rate = new WuiInputNumber(opts_rate);
        let opts_timeout = {
            label: "Timeout (seconds)",
            hint: "Timeout for each request, in seconds.",
            value: LoadTargetOptTimeout(this.opts),
            min: 5,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.Opts.Timeout = v * 1e9;
            },
        };
        let com_input_timeout = new WuiInputNumber(opts_timeout);
        wrapper.appendChild(legend);
        wrapper.appendChild(com_input_duration.el);
        wrapper.appendChild(com_input_rate.el);
        wrapper.appendChild(com_input_timeout.el);
        this.el_content.appendChild(wrapper);
    }
    generateContentVars() {
        if (!this.opts.Vars) {
            return;
        }
        let wrapper = document.createElement("fieldset");
        let legend = document.createElement("legend");
        legend.innerText = "Variables";
        wrapper.appendChild(legend);
        for (const key in this.opts.Vars) {
            let fi = this.opts.Vars[key];
            fi.value = LoadTargetVar(this.opts, key);
            GenerateFormInput(wrapper, fi);
        }
        this.el_content.appendChild(wrapper);
    }
    generateHttpTargets(trunks) {
        if (!this.opts.HttpTargets) {
            return;
        }
        for (let x = 0; x < this.opts.HttpTargets.length; x++) {
            let http_target = this.opts.HttpTargets[x];
            let com_http_target = new HttpTarget(trunks, this.opts, http_target);
            this.http_targets[http_target.ID] = com_http_target;
            this.el_content.appendChild(com_http_target.el);
        }
    }
    generateWebSocketTargets(trunks) {
        if (!this.opts.WebSocketTargets) {
            return;
        }
        for (let x = 0; x < this.opts.WebSocketTargets.length; x++) {
            let ws_target = this.opts.WebSocketTargets[x];
            let com_ws_target = new WebSocketTarget(trunks, this.opts, ws_target);
            this.ws_targets[ws_target.ID] = com_ws_target;
            this.el_content.appendChild(com_ws_target.el);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQ04saUJBQWlCLEVBQ2pCLHFCQUFxQixFQUNyQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLGFBQWEsR0FDYixNQUFNLGdCQUFnQixDQUFBO0FBQ3ZCLE9BQU8sRUFDTixXQUFXLEVBQ1gsaUJBQWlCLEVBQ2pCLGdCQUFnQixHQU9oQixNQUFNLGdCQUFnQixDQUFBO0FBQ3ZCLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM3QyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFaEQsTUFBTSxxQkFBcUIsR0FBRyxpQkFBaUIsQ0FBQTtBQUMvQyxNQUFNLG1CQUFtQixHQUFHLGVBQWUsQ0FBQTtBQVUzQyxNQUFNLE9BQU8sTUFBTTtJQU9sQixZQUNRLE1BQXVCLEVBQ3ZCLElBQXFCO1FBRHJCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQ3ZCLFNBQUksR0FBSixJQUFJLENBQWlCO1FBUjdCLFdBQU0sR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNuRCxlQUFVLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFdkQsaUJBQVksR0FBa0IsRUFBRSxDQUFBO1FBQ2hDLGVBQVUsR0FBdUIsRUFBRSxDQUFBO1FBTWxDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDeEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBRU8sV0FBVyxDQUFDLE1BQXVCO1FBQzFDLElBQUksQ0FBQyxNQUFNLENB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