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
	let fres = await fetch("/_trunks/api/targets")
	let res = await fres.json()
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

async function environment() {
	let el = document.getElementById("main-content")

	let fres = await fetch("/_trunks/api/environment")
	let res = await fres.json()

	_env = res.data

	el.innerHTML = `
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
			<div>
				<h3>
					${http.Name}
					<button onclick="run('${target.ID}', '${http.ID}')">
						Run
					</button>
					<button onclick="attack('${target.ID}', '${http.ID}')">
						Attack
					</button>
				</h3>
				<div class="mono">
					${_requestMethods[http.Method]} ${http.Path} <br/>
					Content-Type: ${_requestTypes[http.RequestType]}
				</div>
		`

		if (Object.keys(http.Headers).length > 0) {
			w += "<h4>Headers</h4>"
			w += renderHttpTargetHeaders(http)
		}

		if (Object.keys(http.Params).length > 0) {
			w += "<h4>Parameters</h4>"
			w += renderHttpTargetParams(target, http)
		}

		w += `
			<h4>Run response</h4>
			<pre id="${http.ID}_response" class="mono">
			</pre>
		`

		if (http.Results && Object.keys(http.Results).length > 0) {
			w += "<h4>Attack results</h4>"
			w += renderHttpAttackResults(target, http)
		}

		w += "</div>"

	}
	w += "</div>"

	document.getElementById("main-content").innerHTML = w
}

function renderHttpTargetHeaders(http) {
	let w = `<div id="${http.ID}_headers">`
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
	w += "</div>"
	return w
}

function renderHttpTargetParams(target, http) {
	let w = `<div id="${http.ID}_params">`
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
	w += "</div>"
	return w
}

function renderHttpAttackResults(target, http) {
	let w = `<div id="${http.ID}_results">`
	for (let x = 0; x < http.Results.length; x++) {
		let result = http.Results[x]
		w += `
			<div class="result">
				<div>${result.Name}</div>
				<pre class="mono">
${atob(result.TextReport)}
				</pre>
				<pre class="mono">
${atob(result.HistReport)}
				</pre>
			</div>
		`
	}
	w += "</div>"
	return w
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
