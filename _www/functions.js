// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, FormInputKindNumber, } from "./interface.js";
export function GetDocumentHeight() {
    const D = document;
    return Math.max(Math.max(D.body.scrollHeight, D.documentElement.scrollHeight), Math.max(D.body.offsetHeight, D.documentElement.offsetHeight), Math.max(D.body.clientHeight, D.documentElement.clientHeight));
}
export function GenerateFormInput(parent, fi) {
    switch (fi.kind) {
        case FormInputKindNumber:
            const wui_input_number_opts = {
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
            const wui_input_number = new WuiInputNumber(wui_input_number_opts);
            parent.appendChild(wui_input_number.el);
            break;
        default:
            const wui_input_string_opts = {
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
            const wui_input_string = new WuiInputString(wui_input_string_opts);
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
    const storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return val;
    }
    const header = httpTarget.Headers[key];
    if (header) {
        return header.value;
    }
    return "";
}
function saveHttpTargetHeader(target, httpTarget, key, value) {
    const storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// LoadHttpTargetParam get HttpTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetParam(target, httpTarget, key) {
    const storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return val;
    }
    const param = httpTarget.Params[key];
    if (param) {
        return param.value;
    }
    return "";
}
function saveHttpTargetParam(target, httpTarget, key, value) {
    const storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`;
    window.localStorage.setItem(storageKey, value);
}
export function LoadTargetOptDuration(target) {
    const storageKey = `${target.ID}.opt.Duration`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return +val / 1e9;
    }
    return target.Opts.Duration / 1e9;
}
function saveTargetOptDuration(target) {
    const storageKey = `${target.ID}.opt.Duration`;
    window.localStorage.setItem(storageKey, "" + target.Opts.Duration);
}
export function LoadTargetOptRatePerSecond(target) {
    const storageKey = `${target.ID}.opt.RatePerSecond`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return +val;
    }
    return target.Opts.RatePerSecond;
}
function saveTargetOptRatePerSecond(target) {
    const storageKey = `${target.ID}.opt.RatePerSecond`;
    window.localStorage.setItem(storageKey, "" + target.Opts.RatePerSecond);
}
export function LoadTargetOptTimeout(target) {
    const storageKey = `${target.ID}.opt.Timeout`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return +val / 1e9;
    }
    return target.Opts.Timeout / 1e9;
}
function saveTargetOptTimeout(target) {
    const storageKey = `${target.ID}.opt.Timeout`;
    window.localStorage.setItem(storageKey, "" + target.Opts.Timeout);
}
//
// LoadTargetVar get target variable from local storage or return the original
// value.
//
export function LoadTargetVar(target, key) {
    const storageKey = `${target.ID}.var.${key}`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return val;
    }
    const tvar = target.Vars[key];
    if (tvar) {
        return tvar.value;
    }
    return "";
}
function saveTargetVar(target, key, value) {
    const storageKey = `${target.ID}.var.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// LoadWsTargetHeader get the WebSocketTarget from local storage by key.
//
export function LoadWsTargetHeader(target, wsTarget, key) {
    const storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return val;
    }
    const header = wsTarget.Headers[key];
    if (header) {
        return header.value;
    }
    return "";
}
function saveWsTargetHeader(target, wsTarget, key, value) {
    const storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`;
    window.localStorage.setItem(storageKey, value);
}
//
// LoadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function LoadWsTargetParam(target, wsTarget, key) {
    const storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`;
    const val = window.localStorage.getItem(storageKey);
    if (val) {
        return val;
    }
    const param = wsTarget.Params[key];
    if (param) {
        return param.value;
    }
    return "";
}
function saveWsTargetParam(target, wsTarget, key, value) {
    const storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`;
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
    for (const [k, fi] of Object.entries(target.Vars)) {
        saveTargetVar(target, k, fi.value);
    }
    if (httpTarget) {
        for (const [k, fi] of Object.entries(httpTarget.Headers)) {
            saveHttpTargetHeader(target, httpTarget, k, fi.value);
        }
        for (const [k, fi] of Object.entries(httpTarget.Params)) {
            saveHttpTargetParam(target, httpTarget, k, fi.value);
        }
    }
    if (wsTarget) {
        for (const [k, fi] of Object.entries(wsTarget.Headers)) {
            saveWsTargetHeader(target, wsTarget, k, fi.value);
        }
        for (const [k, fi] of Object.entries(wsTarget.Params)) {
            saveWsTargetParam(target, wsTarget, k, fi.value);
        }
    }
}
