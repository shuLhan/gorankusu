import { WuiInputString } from "./wui/input/string.js";
import { WuiInputNumber } from "./wui/input/number.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, CLASS_NAV_TARGET, HASH_ENVIRONMENT, } from "./interface.js";
export class Environment {
    constructor(trunks, opts) {
        this.trunks = trunks;
        this.opts = opts;
        this.el_nav = document.createElement("h3");
        this.el_content = document.createElement("div");
        this.el_nav.classList.add(CLASS_NAV_TARGET);
        this.el_nav.innerText = "Environment";
        this.el_nav.onclick = () => {
            trunks.SetContent(HASH_ENVIRONMENT, this.el_content);
        };
        this.generateContent();
    }
    generateContent() {
        let el_title = document.createElement("h2");
        el_title.innerText = "Environment";
        let opts_listen_address = {
            label: "Listen address",
            hint: "The address and port where Trunks is running.",
            value: this.opts.ListenAddress,
            is_disabled: true,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.ListenAddress = v;
            },
        };
        this.com_listen_address = new WuiInputString(opts_listen_address);
        let opts_max_attack_dur = {
            label: "Max. attack duration (seconds)",
            hint: "Maximum attack duration for all targets, in seconds.",
            value: this.opts.MaxAttackDuration / 1e9,
            min: 1,
            is_disabled: true,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.MaxAttackDuration = v * 1e9;
            },
        };
        this.com_max_attack_dur = new WuiInputNumber(opts_max_attack_dur);
        let opts_max_attack_rate = {
            label: "Max. attack rate",
            hint: "Maximum attack rate for all targets.",
            value: this.opts.MaxAttackRate,
            min: 1,
            is_disabled: true,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.MaxAttackRate = v;
            },
        };
        this.com_max_attack_rate = new WuiInputNumber(opts_max_attack_rate);
        let opts_results_dir = {
            label: "Results directory",
            hint: "The directory where the attack result will be saved.",
            value: this.opts.ResultsDir,
            is_disabled: true,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.ResultsDir = v;
            },
        };
        this.com_results_dir = new WuiInputString(opts_results_dir);
        let opts_results_suffix = {
            label: "Results suffix",
            hint: "Optional suffix for the file name of attack result.",
            value: this.opts.ResultsSuffix,
            is_disabled: true,
            class_input: CLASS_INPUT,
            class_label: CLASS_INPUT_LABEL,
            is_hint_toggled: true,
            onChangeHandler: (v) => {
                this.opts.ResultsSuffix = v;
            },
        };
        this.com_results_suffix = new WuiInputString(opts_results_suffix);
        this.el_content.appendChild(el_title);
        this.el_content.appendChild(this.com_listen_address.el);
        this.el_content.appendChild(this.com_max_attack_dur.el);
        this.el_content.appendChild(this.com_max_attack_rate.el);
        this.el_content.appendChild(this.com_results_dir.el);
        this.el_content.appendChild(this.com_results_suffix.el);
    }
    Set(opts) {
        this.opts = opts;
        this.com_listen_address.Set(opts.ListenAddress);
        this.com_max_attack_dur.Set(opts.MaxAttackDuration / 1e9);
        this.com_max_attack_rate.Set(opts.MaxAttackRate);
        this.com_results_dir.Set(opts.ResultsDir);
        this.com_results_suffix.Set(opts.ResultsSuffix);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbnZpcm9ubWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsY0FBYyxFQUFzQixNQUFNLHVCQUF1QixDQUFBO0FBQzFFLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFFMUUsT0FBTyxFQUNOLFdBQVcsRUFDWCxpQkFBaUIsRUFDakIsZ0JBQWdCLEVBQ2hCLGdCQUFnQixHQUdoQixNQUFNLGdCQUFnQixDQUFBO0FBRXZCLE1BQU0sT0FBTyxXQUFXO0lBVXZCLFlBQ1EsTUFBdUIsRUFDdkIsSUFBMEI7UUFEMUIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkIsU0FBSSxHQUFKLElBQUksQ0FBc0I7UUFYbEMsV0FBTSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2xELGVBQVUsR0FBZ0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQVl0RCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtRQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUE7UUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQ3JELENBQUMsQ0FBQTtRQUVELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0lBRU8sZUFBZTtRQUN0QixJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzNDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFBO1FBRWxDLElBQUksbUJBQW1CLEdBQXVCO1lBQzdDLEtBQUssRUFBRSxn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