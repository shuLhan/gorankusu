import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { GenerateFormInput, LoadTargetVar } from "./functions.js";
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
            trunks.ContentRenderer(this.opts, null, null, this.el_content);
        };
        this.el_nav.appendChild(el_target_menu);
        if (this.opts.HttpTargets) {
            for (let ht of this.opts.HttpTargets) {
                let el_target_http = document.createElement("div");
                el_target_http.innerHTML = ht.Name;
                el_target_http.id = `/http/${this.opts.ID}/${ht.ID}`;
                el_target_http.classList.add(CLASS_NAV_TARGET_HTTP);
                el_target_http.onclick = () => {
                    trunks.ContentRenderer(this.opts, ht, null, this.el_content);
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
                    trunks.ContentRenderer(this.opts, null, wst, this.el_content);
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
            value: this.opts.Opts.Duration / 1e9,
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
            value: this.opts.Opts.RatePerSecond,
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
            value: this.opts.Opts.Timeout / 1e9,
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
            let val = LoadTargetVar(this.opts, key);
            GenerateFormInput(wrapper, fi, val);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFDakUsT0FBTyxFQUNOLFdBQVcsRUFDWCxpQkFBaUIsRUFDakIsZ0JBQWdCLEdBT2hCLE1BQU0sZ0JBQWdCLENBQUE7QUFDdkIsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQzdDLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUVoRCxNQUFNLHFCQUFxQixHQUFHLGlCQUFpQixDQUFBO0FBQy9DLE1BQU0sbUJBQW1CLEdBQUcsZUFBZSxDQUFBO0FBVTNDLE1BQU0sT0FBTyxNQUFNO0lBT2xCLFlBQ1EsTUFBdUIsRUFDdkIsSUFBcUI7UUFEckIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsU0FBSSxHQUFKLElBQUksQ0FBaUI7UUFSN0IsV0FBTSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ25ELGVBQVUsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUV2RCxpQkFBWSxHQUFrQixFQUFFLENBQUE7UUFDaEMsZUFBVSxHQUF1QixFQUFFLENBQUE7UUFNbEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN4QixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFFTyxXQUFXLENBQUMsTUFBdUI7UUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUE7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