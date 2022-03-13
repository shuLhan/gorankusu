// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, FormInputKindNumber, } from "./interface.js";
export function GetDocumentHeight() {
    var D = document;
    return Math.max(Math.max(D.body.scrollHeight, D.documentElement.scrollHeight), Math.max(D.body.offsetHeight, D.documentElement.offsetHeight), Math.max(D.body.clientHeight, D.documentElement.clientHeight));
}
export function GenerateFormInput(parent, fi) {
    switch (fi.kind) {
        case FormInputKindNumber:
            let wui_input_number_opts = {
                label: fi.label,
                hint: fi.hint,
                value: +fi.value,
                class_input: CLASS_INPUT,
                class_label: CLASS_INPUT_LABEL,
                is_hint_toggled: true,
                onChangeHandler: (new_value) => {
                    fi.value = "" + new_value;
                },
            };
            if (fi.max) {
                wui_input_number_opts.max = fi.max;
            }
            if (fi.min) {
                wui_input_number_opts.min = fi.min;
            }
            let wui_input_number = new WuiInputNumber(wui_input_number_opts);
            parent.appendChild(wui_input_number.el);
            break;
        default:
            let wui_input_string_opts = {
                label: fi.label,
                hint: fi.hint,
                value: fi.value,
                class_input: CLASS_INPUT,
                class_label: CLASS_INPUT_LABEL,
                is_hint_toggled: true,
                onChangeHandler: (new_value) => {
                    fi.value = new_value;
                },
            };
            let wui_input_string = new WuiInputString(wui_input_string_opts);
            parent.appendChild(wui_input_string.el);
            break;
    }
}
export function HttpMethodToString(m) {
    switch (m) {
        case 0:
            return "GET";
        case 1:
            return "CONNECT";
        case 2:
            return "DELETE";
        case 3:
            return "HEAD";
        case 4:
            return "OPTIONS";
        case 5:
            return "PATCH";
        case 6:
            return "POST";
        case 7:
            return "PUT";
        case 8:
            return "TRACE";
    }
    return "???";
}
//
// LoadHttpTargetHeader get HttpTarget header from local storage by key.
// If no header exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetHeader(target, httpTarget, key) {
    let storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        httpTarget.Headers[key].value);
}
function saveHttpTargetHeader(target, httpTarget, key, value) {
    let storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// LoadHttpTargetParam get HttpTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetParam(target, httpTarget, key) {
    let storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        httpTarget.Params[key].value);
}
function saveHttpTargetParam(target, httpTarget, key, value) {
    let storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`;
    window.localStorage.setItem(storageKey, value);
}
export function LoadTargetOptDuration(target) {
    let storageKey = `${target.ID}.opt.Duration`;
    let val = window.localStorage.getItem(storageKey);
    if (val) {
        return +val / 1e9;
    }
    return target.Opts.Duration / 1e9;
}
function saveTargetOptDuration(target) {
    let storageKey = `${target.ID}.opt.Duration`;
    window.localStorage.setItem(storageKey, "" + target.Opts.Duration);
}
export function LoadTargetOptRatePerSecond(target) {
    let storageKey = `${target.ID}.opt.RatePerSecond`;
    let val = window.localStorage.getItem(storageKey);
    if (val) {
        return +val;
    }
    return target.Opts.RatePerSecond;
}
function saveTargetOptRatePerSecond(target) {
    let storageKey = `${target.ID}.opt.RatePerSecond`;
    window.localStorage.setItem(storageKey, "" + target.Opts.RatePerSecond);
}
export function LoadTargetOptTimeout(target) {
    let storageKey = `${target.ID}.opt.Timeout`;
    let val = window.localStorage.getItem(storageKey);
    if (val) {
        return +val / 1e9;
    }
    return target.Opts.Timeout / 1e9;
}
function saveTargetOptTimeout(target) {
    let storageKey = `${target.ID}.opt.Timeout`;
    window.localStorage.setItem(storageKey, "" + target.Opts.Timeout);
}
//
// LoadTargetVar get target variable from local storage or return the original
// value.
//
export function LoadTargetVar(target, key) {
    let storageKey = `${target.ID}.var.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        target.Vars[key].value);
}
function saveTargetVar(target, key, value) {
    let storageKey = `${target.ID}.var.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// LoadWsTargetHeader get the WebSocketTarget from local storage by key.
//
export function LoadWsTargetHeader(target, wsTarget, key) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        wsTarget.Headers[key].value);
}
function saveWsTargetHeader(target, wsTarget, key, value) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// LoadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function LoadWsTargetParam(target, wsTarget, key) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        wsTarget.Params[key].value);
}
function saveWsTargetParam(target, wsTarget, key, value) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// Save the variables on the Target, Params and Headers on HttpTarget or
// WebSocket to local storage.
//
export function Save(target, httpTarget, wsTarget) {
    saveTargetOptDuration(target);
    saveTargetOptRatePerSecond(target);
    saveTargetOptTimeout(target);
    for (const k in target.Vars) {
        let fi = target.Vars[k];
        saveTargetVar(target, k, fi.value);
    }
    if (httpTarget) {
        for (const k in httpTarget.Headers) {
            let fi = httpTarget.Headers[k];
            saveHttpTargetHeader(target, httpTarget, k, fi.value);
        }
        for (const k in httpTarget.Params) {
            let fi = httpTarget.Params[k];
            saveHttpTargetParam(target, httpTarget, k, fi.value);
        }
    }
    if (wsTarget) {
        for (const k in wsTarget.Headers) {
            let fi = wsTarget.Headers[k];
            saveWsTargetHeader(target, wsTarget, k, fi.value);
        }
        for (const k in wsTarget.Params) {
            let fi = wsTarget.Params[k];
            saveWsTargetParam(target, wsTarget, k, fi.value);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDREQUE0RDtBQUM1RCw0Q0FBNEM7QUFFNUMsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUMxRSxPQUFPLEVBQUUsY0FBYyxFQUFzQixNQUFNLHVCQUF1QixDQUFBO0FBRTFFLE9BQU8sRUFDTixXQUFXLEVBQ1gsaUJBQWlCLEVBRWpCLG1CQUFtQixHQUtuQixNQUFNLGdCQUFnQixDQUFBO0FBRXZCLE1BQU0sVUFBVSxpQkFBaUI7SUFDaEMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFBO0lBQ2hCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FDZCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQzdELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFDN0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUM3RCxDQUFBO0FBQ0YsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxNQUFtQixFQUFFLEVBQWE7SUFDbkUsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFO1FBQ2hCLEtBQUssbUJBQW1CO1lBQ3ZCLElBQUkscUJBQXFCLEdBQXVCO2dCQUMvQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLO2dCQUNoQixXQUFXLEVBQUUsV0FBVztnQkFDeEIsV0FBVyxFQUFFLGlCQUFp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