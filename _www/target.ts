import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js"
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js"

import {
	CLASS_INPUT,
	CLASS_INPUT_LABEL,
	CLASS_NAV_TARGET,
	AttackOptionsInterface,
	HttpTargetInterface,
	KeyValue,
	TargetInterface,
	TrunksInterface,
	WebSocketTargetInterface,
} from "./interface.js"
import { HttpTarget } from "./http_target.js"
import { WebSocketTarget } from "./ws_target.js"

const CLASS_NAV_TARGET_HTTP = "nav_http_target"
const CLASS_NAV_TARGET_WS = "nav_ws_target"

interface MapHttpTarget {
	[key: string]: HttpTarget
}

interface MapWebSocketTarget {
	[key: string]: WebSocketTarget
}

export class Target {
	el_nav: HTMLElement = document.createElement("div")
	el_content: HTMLElement = document.createElement("div")

	http_targets: MapHttpTarget = {}
	ws_targets: MapWebSocketTarget = {}

	constructor(
		public trunks: TrunksInterface,
		public opts: TargetInterface,
	) {
		this.generateNav(trunks)
		this.generateContent(trunks)
	}

	private generateNav(trunks: TrunksInterface) {
		this.el_nav.classList.add(CLASS_NAV_TARGET)

		let el_target_menu = document.createElement("h3")
		el_target_menu.innerHTML = this.opts.Name
		el_target_menu.onclick = () => {
			trunks.ContentRenderer(
				this.opts,
				null,
				null,
				this.el_content,
			)
		}

		this.el_nav.appendChild(el_target_menu)

		if (this.opts.HttpTargets) {
			for (let ht of this.opts.HttpTargets) {
				let el_target_http =
					document.createElement("div")
				el_target_http.innerHTML = ht.Name
				el_target_http.id = `/http/${this.opts.ID}/${ht.ID}`
				el_target_http.classList.add(
					CLASS_NAV_TARGET_HTTP,
				)
				el_target_http.onclick = () => {
					trunks.ContentRenderer(
						this.opts,
						ht,
						null,
						this.el_content,
					)
				}
				this.el_nav.appendChild(el_target_http)
			}
		}

		if (this.opts.WebSocketTargets) {
			for (let wst of this.opts.WebSocketTargets) {
				let el_target_ws =
					document.createElement("div")
				el_target_ws.innerHTML = wst.Name
				el_target_ws.id = `/ws/${this.opts.ID}/${wst.ID}`
				el_target_ws.classList.add(
					CLASS_NAV_TARGET_WS,
				)
				el_target_ws.onclick = () => {
					trunks.ContentRenderer(
						this.opts,
						null,
						wst,
						this.el_content,
					)
				}
				this.el_nav.appendChild(el_target_ws)
			}
		}
	}

	private generateContent(trunks: TrunksInterface) {
		this.generateContentBaseURL()
		this.generateContentAttackOptions()
		this.generateContentVars()
		this.generateHttpTargets(trunks)
		this.generateWebSocketTargets(trunks)
	}

	private generateContentBaseURL() {
		let hdr_target = document.createElement("h2")
		hdr_target.innerText = this.opts.Name

		let opts_base_url: WuiInputStringOpts = {
			label: "Base URL",
			hint: "The base URL where the HTTP request will be send or the target of attack.",
			value: this.opts.BaseUrl,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			onChangeHandler: (v: string) => {
				this.opts.BaseUrl = v
			},
		}
		let com_input_base_url = new WuiInputString(opts_base_url)

		this.el_content.appendChild(hdr_target)
		this.el_content.appendChild(com_input_base_url.el)
	}

	private generateContentAttackOptions() {
		let hdr_attack_opts = document.createElement("h3")
		hdr_attack_opts.innerText = "Attack options"

		let opts_duration: WuiInputNumberOpts = {
			label: "Duration",
			hint: "The duration of attack, in seconds.",
			value: this.opts.Opts.Duration / 1e9,
			min: 1,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			onChangeHandler: (v: number) => {
				this.opts.Opts.Duration = v * 1e9
			},
		}
		let com_input_duration = new WuiInputNumber(opts_duration)

		let opts_rate: WuiInputNumberOpts = {
			label: "Rate per second",
			hint: "The number of request send per second when attacking target.",
			value: this.opts.Opts.RatePerSecond,
			min: 1,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			onChangeHandler: (v: number) => {
				this.opts.Opts.RatePerSecond = v
			},
		}
		let com_input_rate = new WuiInputNumber(opts_rate)

		let opts_timeout: WuiInputNumberOpts = {
			label: "Timeout (seconds)",
			hint: "Timeout for each request, in seconds.",
			value: this.opts.Opts.Timeout / 1e9,
			min: 5,
			class_input: CLASS_INPUT,
			class_label: CLASS_INPUT_LABEL,
			onChangeHandler: (v: number) => {
				this.opts.Opts.Timeout = v * 1e9
			},
		}
		let com_input_timeout = new WuiInputNumber(opts_timeout)

		this.el_content.appendChild(hdr_attack_opts)
		this.el_content.appendChild(com_input_duration.el)
		this.el_content.appendChild(com_input_rate.el)
		this.el_content.appendChild(com_input_timeout.el)
	}

	private generateContentVars() {
		if (!this.opts.Vars) {
			return
		}

		let hdr = document.createElement("h3")
		hdr.innerText = "Variables"

		for (const key in this.opts.Vars) {
			let opts: WuiInputStringOpts = {
				label: key,
				value: this.opts.Vars[key],
				class_input: CLASS_INPUT,
				class_label: CLASS_INPUT_LABEL,
				onChangeHandler: (v: string) => {
					this.opts.Vars[key] = v
				},
			}
		}
	}

	private generateHttpTargets(trunks: TrunksInterface) {
		if (!this.opts.HttpTargets) {
			return
		}

		for (let x = 0; x < this.opts.HttpTargets.length; x++) {
			let http_target = this.opts.HttpTargets[x]

			let com_http_target = new HttpTarget(
				trunks,
				this.opts,
				http_target,
			)
			this.http_targets[http_target.ID] = com_http_target

			this.el_content.appendChild(com_http_target.el)
		}
	}

	private generateWebSocketTargets(trunks: TrunksInterface) {
		if (!this.opts.WebSocketTargets) {
			return
		}

		for (let x = 0; x < this.opts.WebSocketTargets.length; x++) {
			let ws_target = this.opts.WebSocketTargets[x]

			let com_ws_target = new WebSocketTarget(
				trunks,
				this.opts,
				ws_target,
			)
			this.ws_targets[ws_target.ID] = com_ws_target

			this.el_content.appendChild(com_ws_target.el)
		}
	}
}
