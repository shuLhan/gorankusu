import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, FormInputKindNumber, } from "./interface.js";
export function GenerateFormInput(parent, fi, value) {
    switch (fi.kind) {
        case FormInputKindNumber:
            let wui_input_number_opts = {
                label: fi.label,
                hint: fi.hint,
                value: +value,
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
                value: value,
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
    return window.localStorage.getItem(storageKey) || httpTarget.Headers[key].value;
}
//
// LoadHttpTargetParam get HttpTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetParam(target, httpTarget, key) {
    let storageKey = `${target.ID}.http.${httpTarget.ID}.var.${key}`;
    return window.localStorage.getItem(storageKey) || httpTarget.Params[key].value;
}
export function LoadTargetOptDuration(target) {
    let key = `${target.ID}.opt.Duration`;
    let val = window.localStorage.getItem(key);
    if (val) {
        return +val / 1e9;
    }
    return target.Opts.Duration / 1e9;
}
export function LoadTargetOptRatePerSecond(target) {
    let key = `${target.ID}.opt.RatePerSecond`;
    let val = window.localStorage.getItem(key);
    if (val) {
        return +val;
    }
    return target.Opts.RatePerSecond;
}
export function LoadTargetOptTimeout(target) {
    let key = `${target.ID}.opt.Timeout`;
    let val = window.localStorage.getItem(key);
    if (val) {
        return +val / 1e9;
    }
    return target.Opts.Timeout / 1e9;
}
//
// LoadTargetVar get target variable from local storage or return the original
// value.
//
export function LoadTargetVar(target, key) {
    let storageKey = `${target.ID}.var.${key}`;
    return window.localStorage.getItem(storageKey) || target.Vars[key].value;
}
//
// LoadWsTargetHeader get the WebSocketTarget from local storage by key.
//
export function LoadWsTargetHeader(target, wsTarget, key) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`;
    return window.localStorage.getItem(storageKey) || wsTarget.Headers[key].value;
}
//
// LoadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function LoadWsTargetParam(target, wsTarget, key) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.var.${key}`;
    return window.localStorage.getItem(storageKey) || wsTarget.Params[key].value;
}
//
// Save the variables on the Target, Params and Headers on HttpTarget or
// WebSocket to local storage.
//
export function Save(target, httpTarget, wsTarget) {
    window.localStorage.setItem(`${target.ID}.opt.Duration`, "" + target.Opts.Duration);
    window.localStorage.setItem(`${target.ID}.opt.RatePerSecond`, "" + target.Opts.RatePerSecond);
    window.localStorage.setItem(`${target.ID}.opt.Timeout`, "" + target.Opts.Timeout);
    for (const k in target.Vars) {
        let fi = target.Vars[k];
        let key = `${target.ID}.var.${k}`;
        window.localStorage.setItem(key, fi.value);
    }
    if (httpTarget) {
        for (const k in httpTarget.Headers) {
            let fi = httpTarget.Headers[k];
            let key = `${target.ID}.http.${httpTarget.ID}.header.${k}`;
            window.localStorage.setItem(key, fi.value);
        }
        for (const k in httpTarget.Params) {
            let fi = httpTarget.Params[k];
            let key = `${target.ID}.http.${httpTarget.ID}.param.${k}`;
            window.localStorage.setItem(key, fi.value);
        }
    }
    if (wsTarget) {
        for (const k in wsTarget.Headers) {
            let fi = wsTarget.Headers[k];
            let key = `${target.ID}.http.${wsTarget.ID}.header.${k}`;
            window.localStorage.setItem(key, fi.value);
        }
        for (const k in wsTarget.Params) {
            let fi = wsTarget.Params[k];
            let key = `${target.ID}.ws.${wsTarget.ID}.param.${k}`;
            window.localStorage.setItem(key, fi.value);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixFQUVqQixtQkFBbUIsR0FLbkIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUV2QixNQUFNLFVBQVUsaUJBQWlCLENBQUMsTUFBbUIsRUFBRSxFQUFhLEVBQUUsS0FBYTtJQUNsRixRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUU7UUFDaEIsS0FBSyxtQkFBbUI7WUFDdkIsSUFBSSxxQkFBcUIsR0FBdUI7Z0JBQy9DLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQkFDZixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7Z0JBQ2IsS0FBSyxFQUFFLENBQUMsS0FBSztnQkFDYixXQUFXLEVBQUUsV0FBVztnQkFDeEIsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGVBQWUsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRTtvQkFDdEMsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFBO2dCQUMxQixDQUFDO2FBQ0QsQ0FBQTtZQUNELElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQTthQUNsQztZQUNELElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQTthQUNsQztZQUNELElBQUksZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQTtZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFn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