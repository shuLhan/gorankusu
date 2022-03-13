// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbnZpcm9ubWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw0REFBNEQ7QUFDNUQsNENBQTRDO0FBRTVDLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixFQUNqQixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEdBR2hCLE1BQU0sZ0JBQWdCLENBQUE7QUFFdkIsTUFBTSxPQUFPLFdBQVc7SUFVdkIsWUFDUSxNQUF1QixFQUN2QixJQUEwQjtRQUQxQixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QixTQUFJLEdBQUosSUFBSSxDQUFzQjtRQVhsQyxXQUFNLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDbEQsZUFBVSxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBWXRELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQTtRQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDMUIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDckQsQ0FBQyxDQUFBO1FBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQ3ZCLENBQUM7SUFFTyxlQUFlO1FBQ3RCLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDM0MsUUFBUSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUE7UUFFbEMsSUFBSSxtQkFB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