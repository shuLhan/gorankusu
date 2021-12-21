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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixFQUVqQixtQkFBbUIsR0FLbkIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUV2QixNQUFNLFVBQVUsaUJBQWlCO0lBQ2hDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQTtJQUNoQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxFQUM3RCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQzdELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FDN0QsQ0FBQTtBQUNGLENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsTUFBbUIsRUFBRSxFQUFhO0lBQ25FLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRTtRQUNoQixLQUFLLG1CQUFtQjtZQUN2QixJQUFJLHFCQUFxQixHQUF1QjtnQkFDL0MsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLO2dCQUNmLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSTtnQkFDYixLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSztnQkFDaEIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFdBQVcsRUFBRSxpQkFBaUI7Z0JBQzlCLGVBQWUsRUFBRSxJQUFJO2dC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