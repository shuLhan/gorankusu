import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, FormInputKindNumber } from "./interface.js";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFhLG1CQUFtQixFQUF1QixNQUFNLGdCQUFnQixDQUFBO0FBRXBILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxNQUFtQixFQUFFLEVBQWE7SUFDbkUsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFO1FBQ2hCLEtBQUssbUJBQW1CO1lBQ3ZCLElBQUkscUJBQXFCLEdBQXVCO2dCQUMvQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLO2dCQUNoQixXQUFXLEVBQUUsV0FBVztnQkFDeEIsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGVBQWUsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRTtvQkFDdEMsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFBO2dCQUMxQixDQUFDO2FBQ0QsQ0FBQTtZQUNELElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQTthQUNsQztZQUNELElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQTthQUNsQztZQUNELElBQUksZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQTtZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ3ZDLE1BQUs7UUFFTjtZQUNDLElBQUkscUJBQXFCLEdBQXVCO2dCQUMvQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQkFDZixXQUFXLEVBQUUsV0FBVztnQkFDeEIsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGVBQWUsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRTtvQkFDdEMsRUFBRSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUE7Z0JBQ3JCLENBQUM7YUFDRCxDQUFBO1lBQ0QsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO1lBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDdkMsTUFBSztLQUNOO0FBQ0YsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxDQUFTO0lBQzNDLFFBQVEsQ0FBQyxFQUFFO1FBQ1YsS0FBSyxDQUFDO1lBQ0wsT0FBTyxLQUFLLENBQUE7UUFDYixLQUFLLENBQUM7WUFDTCxPQUFPLFNBQVMsQ0FBQTtRQUNqQixLQUFLLENBQUM7WUFDTCxPQUFPLFFBQVEsQ0FBQTtRQUNoQixLQUFLLENBQUM7WUFDTCxPQUFPLE1BQU0sQ0FBQTtRQUNkLEtBQUssQ0FBQztZQUNMLE9BQU8sU0FBUyxDQUFBO1FBQ2pCLEtBQUssQ0FBQztZQUNMLE9BQU8sT0FBTyxDQUFBO1FBQ2YsS0FBSyxDQUFDO1lBQ0wsT0FBTyxNQUFNLENBQUE7UUFDZCxLQUFLLENBQUM7WUFDTCxPQUFPLEtBQUssQ0FBQTtRQUNiLEtBQUssQ0FBQztZQUNMLE9BQU8sT0FBTyxDQUFBO0tBQ2Y7SUFDRCxPQUFPLEtBQUssQ0FBQTtBQUNiLENBQUMifQ==