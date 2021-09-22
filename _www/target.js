import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { GenerateFormInput } from "./functions.js";
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
        let hdr_attack_opts = document.createElement("h3");
        hdr_attack_opts.innerText = "Attack options";
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
        this.el_content.appendChild(hdr_attack_opts);
        this.el_content.appendChild(com_input_duration.el);
        this.el_content.appendChild(com_input_rate.el);
        this.el_content.appendChild(com_input_timeout.el);
    }
    generateContentVars() {
        if (!this.opts.Vars) {
            return;
        }
        let hdr = document.createElement("h3");
        hdr.innerText = "Variables";
        this.el_content.appendChild(hdr);
        for (const key in this.opts.Vars) {
            let fi = this.opts.Vars[key];
            GenerateFormInput(this.el_content, fi);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUNsRCxPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixFQUNqQixnQkFBZ0IsR0FPaEIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUN2QixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDN0MsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRWhELE1BQU0scUJBQXFCLEdBQUcsaUJBQWlCLENBQUE7QUFDL0MsTUFBTSxtQkFBbUIsR0FBRyxlQUFlLENBQUE7QUFVM0MsTUFBTSxPQUFPLE1BQU07SUFPbEIsWUFDUSxNQUF1QixFQUN2QixJQUFxQjtRQURyQixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QixTQUFJLEdBQUosSUFBSSxDQUFpQjtRQVI3QixXQUFNLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDbkQsZUFBVSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXZELGlCQUFZLEdBQWtCLEVBQUUsQ0FBQTtRQUNoQyxlQUFVLEdBQXVCLEVBQUUsQ0FBQTtRQU1sQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3hCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDN0IsQ0FBQztJQUVPLFdBQVcsQ0FBQyxNQUF1QjtRQUMxQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtRQUUzQyxJQUFJ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