let _env = {}
let _targets = {}
let _requestMethods = {
	0: "GET",
	1: "CONNECT",
	2: "DELETE",
	3: "HEAD",
	4: "OPTIONS",
	5: "PATCH",
	6: "POST",
	7: "PUT",
	8: "TRACE",
}
let _requestTypes = {
	0: "(none)",
	1: "(query)",
	2: "application/x-www-form-urlencoded",
	3: "multipart/form-data",
	4: "application/json",
}

async function main() {
	await environmentGet()

	let fres = await fetch("/_trunks/api/targets")
	let res = await fres.json()
	if (res.code != 200) {
		notifError(res.message)
		return
	}

	let targets = res.data

	let w = ""
	for (let x = 0; x < targets.length; x++) {
		let target = targets[x]
		_targets[target.ID] = target

		w += `
			<div class="nav-item">
				<h3 onclick="renderTarget('${target.ID}')">${target.Name}</h3>
			</div>
		`
	}

	document.getElementById("nav-content").innerHTML = w
}

async function environmentGet() {
	let fres = await fetch("/_trunks/api/environment")
	let res = await fres.json()
	if (res.code != 200) {
		notifError(res.message)
		return
	}

	_env = res.data

	if (_env.AttackRunning) {
		updateStateAttack(
			_env.AttackRunning.Target,
			_env.AttackRunning.HttpTarget,
		)
	}
}

async function environmentRender() {
	document.getElementById("main-content").innerHTML = `
		<h2> Environment </h2>
		<div class="environment">
			<div class="input">
				<label for="ListenAddress"> Listen address </label>:
				<input id="ListenAddress" readonly="" value="${_env.ListenAddress}"></input>
			</div>
			<div class="input">
				<label for="MaxAttackDuration"> Max. attack duration (seconds) </label>:
				<input id="MaxAttackDuration" readonly="" value="${
					_env.MaxAttackDuration / 1e9
				}"></input>
			</div>
			<div class="input">
				<label for="MaxAttackRate"> Max. attack rate </label>:
				<input id="MaxAttackRate" readonly="" value="${_env.MaxAttackRate}"></input>
			</div>
			<div class="input">
				<label for="ResultsDir"> Results directory </label>:
				<input id="ResultsDir" readonly="" value="${_env.ResultsDir}"></input>
			</div>
			<div class="input">
				<label for="ResultsSuffix"> Results suffix </label>:
				<input id="ResultsSuffix" readonly="" value="${_env.ResultsSuffix}"></input>
			</div>
		</div>
	`
}

function renderTarget(targetID) {
	let target = _targets[targetID]
	if (target === null) {
		console.log(`invalid target ${targetID}`)
		return
	}
	w = `
		<h2>${target.Name}</h2>
		<div class="AttackOpts">
			<h3> Attack options </h3>
			<div class="input">
				<label> Base URL </label>:
				<input id="BaseUrl" readonly="" value="${target.Opts.BaseUrl}"/>
			</div>
			<div class="input">
				<label> Duration </label>:
				<input id="Duration" value="${target.Opts.Duration / 1e9}"/>
			</div>
			<div class="input">
				<label> Rate per second </label>:
				<input id="RatePerSecond" value="${target.Opts.RatePerSecond}"/>
			</div>
			<div class="input">
				<label> Timeout (seconds) </label>:
				<input id="Timeout" value="${target.Opts.Timeout / 1e9}"/>
			</div>
		</div>
	`

	if (target.Vars && target.Vars.length > 0) {
		w += `
			<div class='Vars'>
				<h3>Variables</h3>
		`
		for (const k in target.Vars) {
			w += `
				<div class="input">
					<label>${k}</label> =
					<input value="${target.Vars[k]}"/>
				</div>
			`
		}
		w += "</div>"
	}

	w += "<div class='HttpTargets'>"

	for (let x = 0; x < target.HttpTargets.length; x++) {
		let http = target.HttpTargets[x]

		w += `
			<div id="${http.ID}" class="HttpTarget">
				<h3>
					${http.Name}
					<button onclick="run('${target.ID}', '${http.ID}')">
						Run
					</button>
					<button onclick="attack('${target.ID}', '${http.ID}')">
						Attack
					</button>
				</h3>

				<div id="${http.ID}_preview" class="preview mono">
					${_requestMethods[http.Method]} ${http.Path} <br/>
					Content-Type: ${_requestTypes[http.RequestType]}
				</div>

				<h4>Headers</h4>
				<div id="${http.ID}_headers" class="headers"></div>

				<h4>Parameters</h4>
				<div id="${http.ID}_params" class="params"></div>

				<h4>Run response</h4>
				<pre id="${http.ID}_response" class="response mono"></pre>

				<h4>Attack results</h4>
				<div id="${http.ID}_results" class="results"></div>
			</div>
		`
	}
	w += "</div>"

	document.getElementById("main-content").innerHTML = w

	for (let x = 0; x < target.HttpTargets.length; x++) {
		let http = target.HttpTargets[x]

		if (Object.keys(http.Headers).length > 0) {
			renderHttpTargetHeaders(target, http)
		}

		if (Object.keys(http.Params).length > 0) {
			renderHttpTargetParams(target, http)
		}

		if (http.Results && Object.keys(http.Results).length > 0) {
			renderHttpAttackResults(target, http)
		}
	}
}

function renderHttpTargetHeaders(target, http) {
	let w = ""
	for (const k in http.Headers) {
		w += `
			<div class="input">
				<label>${k}</label> :
				<input
					value="${http.Headers[k]}"
					onchange="onChangeHttpHeader('${target.ID}', '${http.ID}', '${k}', this.value)"
				/>
			</div>
		`
	}
	document.getElementById(`${http.ID}_headers`).innerHTML = w
}

function renderHttpTargetParams(target, http) {
	let w = ""
	for (const k in http.Params) {
		w += `
			<div class="input">
				<label>${k}</label> :
				<input
					value="${http.Params[k]}"
					onchange="onChangeHttpParam('${target.ID}', '${http.ID}', '${k}', this.value)"
				/>
			</div>
		`
	}
	document.getElementById(`${http.ID}_params`).innerHTML = w
}

function renderHttpAttackResults(target, http) {
	let w = ""
	for (let x = 0; x < http.Results.length; x++) {
		let result = http.Results[x]
		w += `
			<div class="result-name">
				<button onclick="attackResultGet(this, '${result.Name}')">
					Show
				</button>
				&nbsp;
				--
				&nbsp;
				${result.Name}
				&nbsp;
				<button onclick="attackResultDelete('${result.Name}')">
					Delete
				</button>

			</div>
			<div class="result" id="${result.Name}" style="display: none;">
			</div>
		`
	}
	document.getElementById(`${http.ID}_results`).innerHTML = w
}

async function run(targetID, httpTargetID) {
	let req = {}
	req.Target = _targets[targetID]
	req.HttpTarget = getHttpTargetByID(req.Target, httpTargetID)

	let fres = await fetch("/_trunks/api/target/run", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(req),
	})

	let res = await fres.json()
	if (res.code != 200) {
		notifError(res.message)
		return
	}

	let elResponse = document.getElementById(httpTargetID + "_response")
	elResponse.innerHTML = JSON.stringify(res, null, 2)
}

async function attack(targetID, httpTargetID) {
	let target = _targets[targetID]
	let httpTarget = getHttpTargetByID(target, httpTargetID)

	let req = {
		Target: {
			ID: target.ID,
			Opts: target.Opts,
		},
		HttpTarget: {
			ID: httpTarget.ID,
			Headers: httpTarget.Headers,
			Params: httpTarget.Params,
		},
	}

	let fres = await fetch("/_trunks/api/target/attack", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(req),
	})

	let res = await fres.json()
	if (res.code != 200) {
		notifError(res.message)
		return
	}

	updateStateAttack(target, httpTarget)

	notif(res.message)
}

async function attackCancel() {
	let fres = await fetch("/_trunks/api/target/attack", {
		method: "DELETE",
	})

	let res = await fres.json()
	if (res.code != 200) {
		notifError(res.message)
		return
	}

	updateStateAttack(null, null)

	notif(res.message)
}

async function attackResultDelete(name) {
	let url = "/_trunks/api/target/attack/result?name=" + name
	let fres = await fetch(url, {
		method: "DELETE",
	})
	let res = await fres.json()
	if (res.code != 200) {
		console.log("attackResultDelete: ", res)
		notifError(res.message)
		return
	}

	let ids = name.split(".")
	let target = _targets[ids[0]]
	if (!target) {
		return
	}
	let httpTarget = getHttpTargetByID(target, ids[1])
	if (!httpTarget) {
		return
	}
	for (let x = 0; x < httpTarget.Results.length; x++) {
		let result = httpTarget.Results[x]
		if (result.Name == name) {
			httpTarget.Results.splice(x, 1)
			renderHttpAttackResults(target, httpTarget)
			return
		}
	}
}

async function attackResultGet(button, name) {
	let el = document.getElementById(name)

	if (el.style.display === "block") {
		el.style.display = "none"
		button.innerHTML = "Show"
		return
	}

	let url = "/_trunks/api/target/attack/result?name=" + name
	let fres = await fetch(url)
	let res = await fres.json()
	if (res.code != 200) {
		notifError(res.message)
		return
	}

	let result = res.data

	el.innerHTML = `
		<pre class="mono">
${atob(result.TextReport)}
		</pre>
		<pre class="mono">
${atob(result.HistReport)}
		</pre>
	`

	el.style.display = "block"
	button.innerHTML = "Hide"
}

function getHttpTargetByID(target, id) {
	for (let x = 0; x < target.HttpTargets.length; x++) {
		if (id == target.HttpTargets[x].ID) {
			return target.HttpTargets[x]
		}
	}
	return null
}

function onChangeHttpHeader(targetID, httpTargetID, key, val) {
	let target = _targets[targetID]
	let httpTarget = getHttpTargetByID(target, httpTargetID)
	httpTarget.Headers[key] = val
}

function onChangeHttpParam(targetID, httpTargetID, key, val) {
	let target = _targets[targetID]
	let httpTarget = getHttpTargetByID(target, httpTargetID)
	httpTarget.Params[key] = val
}

function notif(msg) {
	let root = document.getElementById("notif")
	let item = document.createElement("div")
	item.innerHTML = msg
	root.appendChild(item)

	setTimeout(function () {
		root.removeChild(item)
	}, 5000)
}

function notifError(msg) {
	let root = document.getElementById("notif-error")
	let item = document.createElement("div")
	item.innerHTML = msg
	root.appendChild(item)

	setTimeout(function () {
		root.removeChild(item)
	}, 5000)
}

function updateStateAttack(target, httpTarget) {
	let el = document.getElementById("stateAttack")
	if (httpTarget) {
		el.innerHTML = `
			${target.Name} / ${httpTarget.Name}
			&nbsp;
			<button onclick="attackCancel('${target.ID}', '${httpTarget.ID}')">
			Cancel
			</button>
		`
	} else {
		el.innerHTML = "-"
	}
}
