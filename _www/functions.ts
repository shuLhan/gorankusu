import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js"
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js"

import { CLASS_INPUT, CLASS_INPUT_LABEL, FormInput, FormInputKindNumber, FormInputKindString } from "./interface.js"

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
			let wui_input_number = new WuiInputNumber(wui_input_number_opts)
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
