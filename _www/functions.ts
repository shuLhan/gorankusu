import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js"
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js"

import {
	CLASS_INPUT,
	CLASS_INPUT_LABEL,
	FormInput,
	FormInputKindNumber,
	FormInputKindString,
	HttpTargetInterface,
	TargetInterface,
	WebSocketTargetInterface,
} from "./interface.js"

export function GenerateFormInput(parent: HTMLElement, fi: FormInput, value: string) {
	switch (fi.kind) {
		case FormInputKindNumber:
			let wui_input_number_opts: WuiInputNumberOpts = {
				label: fi.label,
				hint: fi.hint,
				value: +value,
				class_input: CLASS_INPUT,
				class_label: CLASS_INPUT_LABEL,
				is_hint_toggled: true,
				onChangeHandler: (new_value: number) => {
					fi.value = "" + new_value
				},
			}
			if (fi.max) {
				wui_input_number_opts.max = fi.max
			}
			if (fi.min) {
				wui_input_number_opts.min = fi.min
			}
			let wui_input_number = new WuiInputNumber(wui_input_number_opts)
			parent.appendChild(wui_input_number.el)
			break

		default:
			let wui_input_string_opts: WuiInputStringOpts = {
				label: fi.label,
				hint: fi.hint,
				value: value,
				class_input: CLASS_INPUT,
				class_label: CLASS_INPUT_LABEL,
				is_hint_toggled: true,
				onChangeHandler: (new_value: string) => {
					fi.value = new_value
				},
			}
			let wui_input_string = new WuiInputString(wui_input_string_opts)
			parent.appendChild(wui_input_string.el)
			break
	}
}

export function HttpMethodToString(m: number): string {
	switch (m) {
		case 0:
			return "GET"
		case 1:
			return "CONNECT"
		case 2:
			return "DELETE"
		case 3:
			return "HEAD"
		case 4:
			return "OPTIONS"
		case 5:
			return "PATCH"
		case 6:
			return "POST"
		case 7:
			return "PUT"
		case 8:
			return "TRACE"
	}
	return "???"
}

//
// LoadHttpTargetHeader get HttpTarget header from local storage by key.
// If no header exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetHeader(target: TargetInterface, httpTarget: HttpTargetInterface, key: string): string {
	let storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`
	return window.localStorage.getItem(storageKey) || httpTarget.Headers[key].value
}

//
// LoadHttpTargetParam get HttpTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetParam(target: TargetInterface, httpTarget: HttpTargetInterface, key: string): string {
	let storageKey = `${target.ID}.http.${httpTarget.ID}.var.${key}`
	return window.localStorage.getItem(storageKey) || httpTarget.Params[key].value
}

export function LoadTargetOptDuration(target: TargetInterface): number {
	let key = `${target.ID}.opt.Duration`
	let val = window.localStorage.getItem(key)
	if (val) {
		return +val/1e9
	}
	return target.Opts.Duration / 1e9
}

export function LoadTargetOptRatePerSecond(target: TargetInterface): number {
	let key = `${target.ID}.opt.RatePerSecond`
	let val = window.localStorage.getItem(key)
	if (val) {
		return +val
	}
	return target.Opts.RatePerSecond
}

export function LoadTargetOptTimeout(target: TargetInterface): number {
	let key = `${target.ID}.opt.Timeout`
	let val = window.localStorage.getItem(key)
	if (val) {
		return +val/1e9
	}
	return target.Opts.Timeout / 1e9
}

//
// LoadTargetVar get target variable from local storage or return the original
// value.
//
export function LoadTargetVar(target: TargetInterface, key: string): string {
	let storageKey = `${target.ID}.var.${key}`
	return window.localStorage.getItem(storageKey) || target.Vars[key].value
}

//
// LoadWsTargetHeader get the WebSocketTarget from local storage by key.
//
export function LoadWsTargetHeader(target: TargetInterface, wsTarget: WebSocketTargetInterface, key: string): string {
	let storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`
	return window.localStorage.getItem(storageKey) || wsTarget.Headers[key].value
}

//
// LoadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function LoadWsTargetParam(target: TargetInterface, wsTarget: WebSocketTargetInterface, key: string): string {
	let storageKey = `${target.ID}.ws.${wsTarget.ID}.var.${key}`
	return window.localStorage.getItem(storageKey) || wsTarget.Params[key].value
}

//
// Save the variables on the Target, Params and Headers on HttpTarget or
// WebSocket to local storage.
//
export function Save(
	target: TargetInterface,
	httpTarget: HttpTargetInterface | null,
	wsTarget: WebSocketTargetInterface | null,
) {
	window.localStorage.setItem(`${target.ID}.opt.Duration`, ""+target.Opts.Duration)
	window.localStorage.setItem(`${target.ID}.opt.RatePerSecond`, ""+target.Opts.RatePerSecond)
	window.localStorage.setItem(`${target.ID}.opt.Timeout`, ""+target.Opts.Timeout)

	for (const k in target.Vars) {
		let fi = target.Vars[k]
		let key = `${target.ID}.var.${k}`
		window.localStorage.setItem(key, fi.value)
	}
	if (httpTarget) {
		for (const k in httpTarget.Headers) {
			let fi = httpTarget.Headers[k]
			let key = `${target.ID}.http.${httpTarget.ID}.header.${k}`
			window.localStorage.setItem(key, fi.value)
		}
		for (const k in httpTarget.Params) {
			let fi = httpTarget.Params[k]
			let key = `${target.ID}.http.${httpTarget.ID}.param.${k}`
			window.localStorage.setItem(key, fi.value)
		}
	}
	if (wsTarget) {
		for (const k in wsTarget.Headers) {
			let fi = wsTarget.Headers[k]
			let key = `${target.ID}.http.${wsTarget.ID}.header.${k}`
			window.localStorage.setItem(key, fi.value)
		}
		for (const k in wsTarget.Params) {
			let fi = wsTarget.Params[k]
			let key = `${target.ID}.ws.${wsTarget.ID}.param.${k}`
			window.localStorage.setItem(key, fi.value)
		}
	}
}
