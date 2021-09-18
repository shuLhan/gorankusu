import { WuiInputNumber } from "./wui/input/number.js";
import { WuiInputString } from "./wui/input/string.js";
import { CLASS_INPUT, CLASS_INPUT_LABEL, FormInputKindNumber, FormInputKindString } from "./interface.js";
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
        case FormInputKindString:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQXNCLE1BQU0sdUJBQXVCLENBQUE7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBc0IsTUFBTSx1QkFBdUIsQ0FBQTtBQUUxRSxPQUFPLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFhLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFcEgsTUFBTSxVQUFVLGlCQUFpQixDQUFDLE1BQW1CLEVBQUUsRUFBYTtJQUNuRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUU7UUFDaEIsS0FBSyxtQkFBbUI7WUFDdkIsSUFBSSxxQkFBcUIsR0FBdUI7Z0JBQy9DLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQkFDZixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7Z0JBQ2IsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUs7Z0JBQ2hCLFdBQVcsRUFBRSxXQUFXO2dCQUN4QixXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixlQUFlLEVBQUUsSUFBSTtnQkFDckIsZUFBZSxFQUFFLENBQUMsU0FBaUIsRUFBRSxFQUFFO29CQUN0QyxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUE7Z0JBQzFCLENBQUM7YUFDRCxDQUFBO1lBQ0QsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFO2dCQUNYLHFCQUFxQixDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFBO2FBQ2xDO1lBQ0QsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFO2dCQUNYLHFCQUFxQixDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFBO2FBQ2xDO1lBQ0QsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO1lBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDdkMsTUFBSztRQUVOLEtBQUssbUJBQW1CO1lBQ3ZCLElBQUkscUJBQXFCLEdBQXVCO2dCQUMvQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQkFDZixXQUFXLEVBQUUsV0FBVztnQkFDeEIsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGVBQWUsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRTtvQkFDdEMsRUFBRSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUE7Z0JBQ3JCLENBQUM7YUFDRCxDQUFBO1lBQ0QsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO1lBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDdkMsTUFBSztLQUNOO0FBQ0YsQ0FBQyJ9