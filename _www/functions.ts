// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

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

export function GetDocumentHeight() {
	var D = document
	return Math.max(
		Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
		Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
		Math.max(D.body.clientHeight, D.documentElement.clientHeight),
	)
}

export function GenerateFormInput(parent: HTMLElement, fi: FormInput) {
	switch (fi.kind) {
		case FormInputKindNumber:
			let wui_input_number_opts: WuiInputNumberOpts = {
				label: fi.label,
				hint: fi.hint,
				value: +fi.value,
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
			let wui_input_number = new WuiInputNumber(
				wui_input_number_opts,
			)
			parent.appendChild(wui_input_number.el)
			break

		default:
			let wui_input_string_opts: WuiInputStringOpts = {
				label: fi.label,
				hint: fi.hint,
				value: fi.value,
				class_input: CLASS_INPUT,
				class_label: CLASS_INPUT_LABEL,
				is_hint_toggled: true,
				onChangeHandler: (new_value: string) => {
					fi.value = new_value
				},
			}
			let wui_input_string = new WuiInputString(
				wui_input_string_opts,
			)
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
export function LoadHttpTargetHeader(
	target: TargetInterface,
	httpTarget: HttpTargetInterface,
	key: string,
): string {
	let storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`
	return (
		window.localStorage.getItem(storageKey) ||
		httpTarget.Headers[key].value
	)
}

function saveHttpTargetHeader(
	target: TargetInterface,
	httpTarget: HttpTargetInterface,
	key: string,
	value: string,
) {
	let storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`
	window.localStorage.setItem(storageKey, value)
}

//
// LoadHttpTargetParam get HttpTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetParam(
	target: TargetInterface,
	httpTarget: HttpTargetInterface,
	key: string,
): string {
	let storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`
	return (
		window.localStorage.getItem(storageKey) ||
		httpTarget.Params[key].value
	)
}

function saveHttpTargetParam(
	target: TargetInterface,
	httpTarget: HttpTargetInterface,
	key: string,
	value: string,
) {
	let storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`
	window.localStorage.setItem(storageKey, value)
}

export function LoadTargetOptDuration(target: TargetInterface): number {
	let storageKey = `${target.ID}.opt.Duration`
	let val = window.localStorage.getItem(storageKey)
	if (val) {
		return +val / 1e9
	}
	return target.Opts.Duration / 1e9
}

function saveTargetOptDuration(target: TargetInterface) {
	let storageKey = `${target.ID}.opt.Duration`
	window.localStorage.setItem(storageKey, "" + target.Opts.Duration)
}

export function LoadTargetOptRatePerSecond(target: TargetInterface): number {
	let storageKey = `${target.ID}.opt.RatePerSecond`
	let val = window.localStorage.getItem(storageKey)
	if (val) {
		return +val
	}
	return target.Opts.RatePerSecond
}

function saveTargetOptRatePerSecond(target: TargetInterface) {
	let storageKey = `${target.ID}.opt.RatePerSecond`
	window.localStorage.setItem(
		storageKey,
		"" + target.Opts.RatePerSecond,
	)
}

export function LoadTargetOptTimeout(target: TargetInterface): number {
	let storageKey = `${target.ID}.opt.Timeout`
	let val = window.localStorage.getItem(storageKey)
	if (val) {
		return +val / 1e9
	}
	return target.Opts.Timeout / 1e9
}

function saveTargetOptTimeout(target: TargetInterface) {
	let storageKey = `${target.ID}.opt.Timeout`
	window.localStorage.setItem(storageKey, "" + target.Opts.Timeout)
}

//
// LoadTargetVar get target variable from local storage or return the original
// value.
//
export function LoadTargetVar(target: TargetInterface, key: string): string {
	let storageKey = `${target.ID}.var.${key}`
	return (
		window.localStorage.getItem(storageKey) ||
		target.Vars[key].value
	)
}

function saveTargetVar(target: TargetInterface, key: string, value: string) {
	let storageKey = `${target.ID}.var.${key}`
	window.localStorage.setItem(storageKey, value)
}

//
// LoadWsTargetHeader get the WebSocketTarget from local storage by key.
//
export function LoadWsTargetHeader(
	target: TargetInterface,
	wsTarget: WebSocketTargetInterface,
	key: string,
): string {
	let storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`
	return (
		window.localStorage.getItem(storageKey) ||
		wsTarget.Headers[key].value
	)
}

function saveWsTargetHeader(
	target: TargetInterface,
	wsTarget: WebSocketTargetInterface,
	key: string,
	value: string,
) {
	let storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`
	window.localStorage.setItem(storageKey, value)
}

//
// LoadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function LoadWsTargetParam(
	target: TargetInterface,
	wsTarget: WebSocketTargetInterface,
	key: string,
): string {
	let storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`
	return (
		window.localStorage.getItem(storageKey) ||
		wsTarget.Params[key].value
	)
}

function saveWsTargetParam(
	target: TargetInterface,
	wsTarget: WebSocketTargetInterface,
	key: string,
	value: string,
) {
	let storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`
	window.localStorage.setItem(storageKey, value)
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
	saveTargetOptDuration(target)
	saveTargetOptRatePerSecond(target)
	saveTargetOptTimeout(target)

	for (const k in target.Vars) {
		let fi = target.Vars[k]
		saveTargetVar(target, k, fi.value)
	}
	if (httpTarget) {
		for (const k in httpTarget.Headers) {
			let fi = httpTarget.Headers[k]
			saveHttpTargetHeader(target, httpTarget, k, fi.value)
		}
		for (const k in httpTarget.Params) {
			let fi = httpTarget.Params[k]
			saveHttpTargetParam(target, httpTarget, k, fi.value)
		}
	}
	if (wsTarget) {
		for (const k in wsTarget.Headers) {
			let fi = wsTarget.Headers[k]
			saveWsTargetHeader(target, wsTarget, k, fi.value)
		}
		for (const k in wsTarget.Params) {
			let fi = wsTarget.Params[k]
			saveWsTargetParam(target, wsTarget, k, fi.value)
		}
	}
}
