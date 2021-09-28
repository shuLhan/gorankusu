import {
	WuiWebSocketClient,
	WuiWebSocketOptions,
	WuiWebSocketRequest,
	WuiWebSocketResponse,
} from "./wui/websocket_client.js"

import { Environment } from "./environment.js"
import { Save } from "./functions.js"
import {
	CLASS_NAV_TARGET,
	HASH_ENVIRONMENT,
	AttackResult,
	EnvironmentInterface,
	HttpResponseInterface,
	HttpTargetInterface,
	MapIdTarget,
	MapNumberString,
	RunRequestInterface,
	RunResponseInterface,
	TargetInterface,
	WebSocketTargetInterface,
} from "./interface.js"
import { Target } from "./target.js"
import { wui_notif } from "./vars.js"

const API_ATTACK_HTTP = "/_trunks/api/attack/http"
const API_ATTACK_RESULT = "/_trunks/api/attack/result"
const API_ENVIRONMENT = "/_trunks/api/environment"
const API_TARGETS = "/_trunks/api/targets"

const API_TARGET_RUN_HTTP = "/_trunks/api/target/run/http"
const API_TARGET_RUN_WEBSOCKET = "/_trunks/api/target/run/websocket"

const CLASS_ATTACK_RUNNING = "trunks_attack_running"
const CLASS_FOOTER = "trunks_footer"
const CLASS_MAIN = "trunks_main"
const CLASS_NAV = "trunks_nav"

const WSC_RECONNECT_INTERVAL = 5000

interface MapIDTarget {
	[key: string]: Target
}

export class Trunks {
	el!: HTMLDivElement
	el_attack_running!: HTMLElement
	el_attack_cancel!: HTMLButtonElement
	el_content!: HTMLElement
	el_nav_content!: HTMLElement
	el_ws_conn_status!: HTMLElement

	env: EnvironmentInterface = {
		ListenAddress: "",
		WebSocketListenPort: 8218,
		MaxAttackDuration: 0,
		MaxAttackRate: 0,
		ResultsDir: "",
		ResultsSuffix: "",
		AttackRunning: null,
	}

	wsc_opts: WuiWebSocketOptions
	wsc: WuiWebSocketClient | null = null

	com_env!: Environment
	targets: MapIDTarget = {}

	constructor() {
		this.el = document.createElement("div")

		this.wsc_opts = {
			address: "",
			insecure: true,
			auto_reconnect: true,
			auto_reconnect_interval: WSC_RECONNECT_INTERVAL,
			onBroadcast: (res: WuiWebSocketResponse) => {
				this.wsOnBroadcast(res)
			},
			onConnected: () => {
				this.wsOnConnected()
			},
			onDisconnected: () => {
				this.wsOnDisconnected()
			},
			onError: () => {
				this.wsOnError()
			},
		}

		this.com_env = new Environment(this, this.env)
		this.generateNav()
		this.generateContent()

		document.body.appendChild(this.el)
	}

	private generateNav() {
		let el_nav = document.createElement("div")
		el_nav.classList.add(CLASS_NAV)

		this.el_ws_conn_status = document.createElement("div")

		let fs_attack_running = document.createElement("fieldset")
		let legend = document.createElement("legend")
		legend.innerText = "Attack running"

		this.el_attack_running = document.createElement("span")
		this.el_attack_running.classList.add(CLASS_ATTACK_RUNNING)

		this.el_nav_content = document.createElement("div")

		let el_nav_footer = document.createElement("div")
		el_nav_footer.classList.add(CLASS_FOOTER)
		el_nav_footer.innerHTML = `
			<div>
				Powered by
				<a href="https://sr.ht/~shulhan/trunks" target="_blank">Trunks</a>
			</div>
		`

		el_nav.appendChild(this.el_ws_conn_status)

		fs_attack_running.appendChild(legend)
		fs_attack_running.appendChild(this.el_attack_running)
		el_nav.appendChild(fs_attack_running)

		el_nav.appendChild(this.com_env.el_nav)
		el_nav.appendChild(this.el_nav_content)
		el_nav.appendChild(el_nav_footer)
		this.el.appendChild(el_nav)
	}

	private generateContent() {
		let wrapper = document.createElement("div")
		wrapper.classList.add(CLASS_MAIN)

		this.el_attack_cancel = document.createElement("button")
		this.el_attack_cancel.innerHTML = "Cancel"

		this.el_content = document.createElement("div")
		wrapper.appendChild(this.el_content)

		this.el.appendChild(wrapper)
	}

	async Init() {
		await this.apiEnvironmentGet()
		await this.initTargets()

		this.windowOnHashChange()
		window.onhashchange = () => {
			this.windowOnHashChange()
		}

		this.wsc_opts.address =
			window.location.hostname +
			":" +
			this.env.WebSocketListenPort
		this.wsc = new WuiWebSocketClient(this.wsc_opts)
	}

	async apiEnvironmentGet() {
		let http_res = await fetch(API_ENVIRONMENT)
		let res = await http_res.json()
		if (res.code != 200) {
			wui_notif.Error(res.message)
			return
		}

		this.env = res.data

		this.setAttackRunning(this.env.AttackRunning)
		this.com_env.Set(this.env)
	}

	async initTargets() {
		let http_res = await fetch(API_TARGETS)
		let res = await http_res.json()
		if (res.code != 200) {
			wui_notif.Error(res.message)
			return
		}

		let targets = res.data

		this.el_nav_content.innerHTML = ""

		for (let target of targets) {
			let com_target = new Target(this, target)
			this.targets[target.ID] = com_target

			this.el_nav_content.appendChild(com_target.el_nav)
		}
	}

	private async onClickAttackCancel() {
		if (!this.wsc) {
			console.error("websocket is not connected")
			return
		}

		let req: WuiWebSocketRequest = {
			id: Date.now(),
			method: "DELETE",
			target: API_ATTACK_HTTP,
		}

		let json_res = await this.wsc.Send(req)
		if (json_res.code != 200) {
			wui_notif.Error(json_res.message)
			return
		}

		this.setAttackRunning(null)

		wui_notif.Info(json_res.message)
	}

	private windowOnHashChange() {
		// Parse the location hash.
		let path = window.location.hash.substring(1)
		let paths = path.split("/")
		if (paths.length < 2) {
			return
		}

		if (paths[1] === HASH_ENVIRONMENT) {
			this.el_content.innerHTML = ""
			this.el_content.appendChild(this.com_env.el_content)
			return
		}

		let el: HTMLElement | null
		let target = this.targets[paths[1]]
		switch (paths.length) {
			case 2:
			case 3:
				if (!target) {
					return
				}
				this.el_content.innerHTML = ""
				this.el_content.appendChild(target.el_content)
				el = document.getElementById(paths[1])
				if (el) {
					el.scrollIntoView()
				}
				break

			case 4:
				if (paths[2] === "http") {
					this.el_content.innerHTML = ""
					this.el_content.appendChild(
						target.el_content,
					)
				} else if (paths[2] === "ws") {
					this.el_content.innerHTML = ""
					this.el_content.appendChild(
						target.el_content,
					)
				}
				el = document.getElementById(paths[3])
				if (el) {
					el.scrollIntoView()
				}
				break
		}
	}

	private wsOnBroadcast(res: WuiWebSocketResponse) {
		switch (res.message) {
			case API_ATTACK_RESULT:
				let result = JSON.parse(
					atob(res.body),
				) as AttackResult

				this.setAttackRunning(null)

				let comTarget = this.targets[result.TargetID]
				let comHttpTarget =
					comTarget.http_targets[
						result.HttpTargetID
					]

				comHttpTarget.AddAttackResult(result)

				wui_notif.Info(
					`Attack finished on "${comTarget.opts.Name}/${comHttpTarget.opts.Name}".`,
				)
		}
	}

	private wsOnConnected() {
		this.el_ws_conn_status.innerHTML = "&#9670; Connected"
	}
	private wsOnDisconnected() {
		this.el_ws_conn_status.innerHTML = "&#9671; Disconnected"
	}
	private wsOnError() {
		// TODO
	}

	setAttackRunning(runRequest: RunRequestInterface | null) {
		if (!runRequest) {
			this.el_attack_running.innerHTML = "-"
			return
		}
		if (!runRequest.Target || !runRequest.HttpTarget) {
			this.el_attack_running.innerHTML = "-"
			return
		}
		this.el_attack_running.innerHTML = `
			${runRequest.Target.Name} <br/>
			/ ${runRequest.HttpTarget.Name} <br/>
			<br/>
		`
		this.el_attack_cancel.onclick = () => {
			this.onClickAttackCancel()
		}
		this.el_attack_running.appendChild(this.el_attack_cancel)

		wui_notif.Info(
			`Attacking "${runRequest.Target.Name}/${runRequest.HttpTarget.Name}" ...`,
		)
	}

	async AttackHttp(
		target: TargetInterface,
		http_target: HttpTargetInterface,
	): Promise<HttpResponseInterface | null> {
		if (!this.wsc) {
			console.error("websocket is not connected")
			return null
		}

		Save(target, http_target, null)

		let attackReq: RunRequestInterface = {
			Target: {
				ID: target.ID,
				Opts: target.Opts,
				Vars: target.Vars,
				Name: target.Name,
				BaseUrl: target.BaseUrl,
				HttpTargets: [],
				WebSocketTargets: [],
			},
			HttpTarget: {
				ID: http_target.ID,
				Name: http_target.Name,
				Method: http_target.Method,
				Path: http_target.Path,
				RequestType: http_target.RequestType,
				Headers: http_target.Headers,
				Params: http_target.Params,
				Results: [],
				AllowAttack: http_target.AllowAttack,
				IsCustomizable: http_target.IsCustomizable,
			},
			WebSocketTarget: null,
		}

		let req: WuiWebSocketRequest = {
			id: Date.now(),
			method: "POST",
			target: API_ATTACK_HTTP,
			body: btoa(JSON.stringify(attackReq)),
		}

		let json_res = await this.wsc.Send(req)
		if (json_res.code != 200) {
			wui_notif.Error(json_res.message)
			return null
		}

		this.setAttackRunning(attackReq)

		return json_res
	}

	async AttackHttpDelete(
		name: string,
	): Promise<HttpResponseInterface | null> {
		let msg = `Are you sure you want to delete the result: ${name}?`
		let yes = window.confirm(msg)
		if (!yes) {
			return null
		}

		let url = API_ATTACK_RESULT + "?name=" + name
		let fres = await fetch(url, {
			method: "DELETE",
		})
		let json_res = await fres.json()
		if (json_res.code != 200) {
			wui_notif.Error(json_res.message)
			return null
		}
		return json_res
	}

	async AttackHttpGet(name: string): Promise<HttpResponseInterface> {
		let url = API_ATTACK_RESULT + "?name=" + name
		let fres = await fetch(url)
		let res = await fres.json()
		if (res.code != 200) {
			wui_notif.Error(res.message)
		}
		return res
	}

	ContentRenderer(
		target: TargetInterface,
		http_target: HttpTargetInterface,
		ws_target: WebSocketTargetInterface,
		el: HTMLElement,
	): void {
		let hash = "#/" + target.ID
		if (http_target) {
			hash += "/http/" + http_target.ID
		} else if (ws_target) {
			hash += "/ws/" + ws_target.ID
		}
		window.location.hash = hash

		this.el_content.innerHTML = ""
		this.el_content.appendChild(el)
	}

	async RunHttp(
		target: TargetInterface,
		http_target: HttpTargetInterface,
	): Promise<RunResponseInterface | null> {
		Save(target, http_target, null)

		let req: RunRequestInterface = {
			Target: {
				ID: target.ID,
				Opts: target.Opts,
				Vars: target.Vars,
				Name: "",
				BaseUrl: "",
				HttpTargets: [],
				WebSocketTargets: [],
			},
			HttpTarget: http_target,
			WebSocketTarget: null,
		}

		let http_res = await fetch(API_TARGET_RUN_HTTP, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(req),
		})

		let json_res = await http_res.json()
		if (json_res.code != 200) {
			wui_notif.Error(json_res.message)
			return null
		}

		let res = json_res.data as RunResponseInterface

		if (res.ResponseStatusCode != 200) {
			wui_notif.Error(
				`${http_target.Name}: ${res.ResponseStatus}`,
			)
		} else {
			wui_notif.Info(
				`${http_target.Name}: ${res.ResponseStatus}`,
			)
		}

		return res
	}

	async RunWebSocket(
		target: TargetInterface,
		ws_target: WebSocketTargetInterface,
	): Promise<HttpResponseInterface | null> {
		Save(target, null, ws_target)

		let req: RunRequestInterface = {
			Target: {
				ID: target.ID,
				Opts: target.Opts,
				Vars: target.Vars,
				Name: "",
				BaseUrl: "",
				HttpTargets: [],
				WebSocketTargets: [],
			},
			HttpTarget: null,
			WebSocketTarget: ws_target,
		}

		let fres = await fetch(API_TARGET_RUN_WEBSOCKET, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(req),
		})

		let json_res = await fres.json()
		if (json_res.code != 200) {
			wui_notif.Error(json_res.message)
			return null
		}
		wui_notif.Info(`${ws_target.Name}: success.`)
		return json_res
	}

	SetContent(path: string, el: HTMLElement): void {
		this.el_content.innerHTML = ""
		this.el_content.appendChild(el)

		window.location.hash = "#/" + path
	}
}
