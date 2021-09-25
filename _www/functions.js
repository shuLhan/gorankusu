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
    return (window.localStorage.getItem(storageKey) ||
        httpTarget.Headers[key].value);
}
//
// LoadHttpTargetParam get HttpTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HttpTarget itself.
//
export function LoadHttpTargetParam(target, httpTarget, key) {
    let storageKey = `${target.ID}.http.${httpTarget.ID}.var.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        httpTarget.Params[key].value);
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
    return (window.localStorage.getItem(storageKey) ||
        wsTarget.Headers[key].value);
}
//
// LoadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function LoadWsTargetParam(target, wsTarget, key) {
    let storageKey = `${target.ID}.ws.${wsTarget.ID}.var.${key}`;
    return (window.localStorage.getItem(storageKey) ||
        wsTarget.Params[key].value);
}
//
// Save the variables on the Target, Params and Headers on HttpTarget or
// WebSocket to local storage.
//
export function Save(target, httpTarget, wsTarget) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixFQUVqQixtQkFBbUIsR0FLbkIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUV2QixNQUFNLFVBQVUsaUJBQWlCLENBQ2hDLE1BQW1CLEVBQ25CLEVBQWEsRUFDYixLQUFhO0lBRWIsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFO1FBQ2hCLEtBQUssbUJBQW1CO1lBQ3ZCLElBQUkscUJBQXFCLEdBQXVCO2dCQUMvQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEtBQUssRUFBRSxDQUFDLEtBQUs7Z0JBQ2IsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFdBQVcsRUFBRSxpQkFBaUI7Z0JBQzlCLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixlQUFlLEVBQUUsQ0FBQyxTQUFpQixFQUFFLEVBQUU7b0JBQ3RDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQTtnQkFDMUIsQ0FBQzthQUNELENBQUE7WUFDRCxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1gscUJBQXFCLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUE7YUFDbEM7WUFDRCxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1gscUJBQXFCLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUE7YUFDbEM7WUFDRCxJQUFJLGdCQUFnQixHQUFHLElBQUksY0FBYyxDQUN4QyxxQkFBcUIsQ0FDckIsQ0FBQTtZQUNELE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JB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