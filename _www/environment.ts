// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js"
import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js"

import {
	CLASS_INPUT,
	CLASS_INPUT_LABEL,
	CLASS_NAV_TARGET,
	HASH_ENVIRONMENT,
	EnvironmentInterface,
	TrunksInterface,
} from "./interface.js"

export class Environment {
	el_nav: HTMLElement = document.createElement("h3")
	el_content: HTMLElement = document.createElement("div")

	com_listen_address!: WuiInputString
	com_max_attack_dur!: WuiInputNumber
	com_max_attack_rate!: WuiInputNumber
	com_results_dir!: WuiInputString
	com_results_suffix!: WuiInputString

	constructor(
		public trunks: TrunksInterface,
		public opts: EnvironmentInterface,
	) {
		this.el_nav.classList.add(CLASS_NAV_TARGET)
		this.el_nav.innerText = "Environment"
		this.el_nav.onclick = () => {
			trunks.SetContent(HASH_ENVIRONMENT, this.el_content)
		}

		this.generateContent()
	}

	private generateContent() {
		let el_title = document.createElement("h2")
		el_title.innerText = "Environment"

		let opts_listen_address: WuiInputStringOpts = {
			label: "Listen address",
			hint: "The address and port where Trunks is running.",
			value: this.opts.ListenAddress,
			is_disabled: true,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			is_hint_toggled: true,
			onChangeHandler: (v: string) => {
				this.opts.ListenAddress = v
			},
		}
		this.com_listen_address = new WuiInputString(
			opts_listen_address,
		)

		let opts_max_attack_dur: WuiInputNumberOpts = {
			label: "Max. attack duration (seconds)",
			hint: "Maximum attack duration for all targets, in seconds.",
			value: this.opts.MaxAttackDuration / 1e9,
			min: 1,
			is_disabled: true,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			is_hint_toggled: true,
			onChangeHandler: (v: number) => {
				this.opts.MaxAttackDuration = v * 1e9
			},
		}
		this.com_max_attack_dur = new WuiInputNumber(
			opts_max_attack_dur,
		)

		let opts_max_attack_rate: WuiInputNumberOpts = {
			label: "Max. attack rate",
			hint: "Maximum attack rate for all targets.",
			value: this.opts.MaxAttackRate,
			min: 1,
			is_disabled: true,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			is_hint_toggled: true,
			onChangeHandler: (v: number) => {
				this.opts.MaxAttackRate = v
			},
		}
		this.com_max_attack_rate = new WuiInputNumber(
			opts_max_attack_rate,
		)

		let opts_results_dir: WuiInputStringOpts = {
			label: "Results directory",
			hint: "The directory where the attack result will be saved.",
			value: this.opts.ResultsDir,
			is_disabled: true,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			is_hint_toggled: true,
			onChangeHandler: (v: string) => {
				this.opts.ResultsDir = v
			},
		}
		this.com_results_dir = new WuiInputString(opts_results_dir)

		let opts_results_suffix: WuiInputStringOpts = {
			label: "Results suffix",
			hint: "Optional suffix for the file name of attack result.",
			value: this.opts.ResultsSuffix,
			is_disabled: true,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			is_hint_toggled: true,
			onChangeHandler: (v: string) => {
				this.opts.ResultsSuffix = v
			},
		}
		this.com_results_suffix = new WuiInputString(
			opts_results_suffix,
		)

		this.el_content.appendChild(el_title)
		this.el_content.appendChild(this.com_listen_address.el)
		this.el_content.appendChild(this.com_max_attack_dur.el)
		this.el_content.appendChild(this.com_max_attack_rate.el)
		this.el_content.appendChild(this.com_results_dir.el)
		this.el_content.appendChild(this.com_results_suffix.el)
	}

	Set(opts: EnvironmentInterface) {
		this.opts = opts

		this.com_listen_address.Set(opts.ListenAddress)
		this.com_max_attack_dur.Set(opts.MaxAttackDuration / 1e9)
		this.com_max_attack_rate.Set(opts.MaxAttackRate)
		this.com_results_dir.Set(opts.ResultsDir)
		this.com_results_suffix.Set(opts.ResultsSuffix)
	}
}
