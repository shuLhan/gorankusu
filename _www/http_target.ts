// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { WuiInputSelect, WuiInputSelectOpts } from "./wui/input/select.js";
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js";

import {
  GenerateFormInput,
  LoadHttpTargetHeader,
  LoadHttpTargetParam,
} from "./functions.js";
import {
  CLASS_INPUT,
  CLASS_INPUT_LABEL,
  AttackResult,
  HttpTargetInterface,
  TargetInterface,
  TrunksInterface,
} from "./interface.js";

const CLASS_HTTP_TARGET = "http_target";
const CLASS_HTTP_TARGET_ACTIONS = "http_target_actions";
const CLASS_HTTP_TARGET_ATTACK_RESULT = "http_target_attack_result";
const CLASS_HTTP_TARGET_ATTACK_RESULT_ACTIONS =
  "http_target_attack_result_actions";
const CLASS_HTTP_TARGET_INPUT = "http_target_input";
const CLASS_HTTP_TARGET_INPUT_HEADER = "http_target_input_header";
const CLASS_HTTP_TARGET_INPUT_PARAMS = "http_target_input_params";
const CLASS_HTTP_TARGET_OUT_ATTACK = "http_target_out_attack";
const CLASS_HTTP_TARGET_OUT_MONO = "http_target_out_mono";
const CLASS_HTTP_TARGET_OUT_RUN = "http_target_out_run";

const CONTENT_TYPE_JSON = "application/json";

export class HttpTarget {
  el: HTMLElement = document.createElement("div");
  el_button_run: HTMLButtonElement = document.createElement("button");
  el_button_attack: HTMLButtonElement = document.createElement("button");
  el_request_input: HTMLElement = document.createElement("div");
  el_out_request: HTMLElement = document.createElement("div");
  el_out_response: HTMLElement = document.createElement("div");
  el_out_response_body: HTMLElement = document.createElement("div");
  el_out_attack: HTMLElement = document.createElement("fieldset");
  el_out_attack_results: HTMLElement = document.createElement("div");

  constructor(
    public trunks: TrunksInterface,
    public target: TargetInterface,
    public opts: HttpTargetInterface,
  ) {
    this.el.id = opts.ID;
    this.el.classList.add(CLASS_HTTP_TARGET);

    const el_title = document.createElement("h3");
    el_title.innerText = opts.Name;
    this.el.appendChild(el_title);

    this.generateActions(el_title);
    this.generateHint(this.el);
    this.generateInput(this.el);
    this.generateOutput(this.el);
    this.generateOutputAttack(this.el);
  }

  private generateActions(parent: HTMLElement) {
    const el_actions = document.createElement("span");
    el_actions.classList.add(CLASS_HTTP_TARGET_ACTIONS);

    this.el_button_run.innerText = "Run";
    this.el_button_run.onclick = () => {
      this.onClickRun();
    };
    el_actions.appendChild(this.el_button_run);

    if (this.opts.AllowAttack) {
      this.el_button_attack.innerText = "Attack";
      this.el_button_attack.onclick = () => {
        this.onClickAttack();
      };
      el_actions.appendChild(this.el_button_attack);
    }

    parent.appendChild(el_actions);
  }

  private generateHint(parent: HTMLElement) {
    if (!this.opts.Hint) {
      return;
    }
    const el_hint = document.createElement("p");
    el_hint.innerHTML = this.opts.Hint;
    parent.appendChild(el_hint);
  }

  private generateInput(parent: HTMLElement) {
    this.el_request_input.classList.add(CLASS_HTTP_TARGET_INPUT);

    this.generateRequestMethod(this.el_request_input);
    this.generateRequestContentType(this.el_request_input);
    this.generateRequestHeaders(this.el_request_input);
    this.generateRequestParameters(this.el_request_input);

    parent.appendChild(this.el_request_input);
  }

  private generateRequestMethod(parent: HTMLElement) {
    const m = "" + this.opts.Method;
    const select_opts: WuiInputSelectOpts = {
      label: "",
      name: "",
      options: {
        GET: {
          value: "0",
          selected: m === "0",
        },
        CONNECT: {
          value: "1",
          selected: m === "1",
        },
        DELETE: {
          value: "2",
          selected: m === "2",
        },
        HEAD: {
          value: "3",
          selected: m === "3",
        },
        OPTIONS: {
          value: "4",
          selected: m === "4",
        },
        PATCH: {
          value: "5",
          selected: m === "5",
        },
        POST: {
          value: "6",
          selected: m === "6",
        },
        PUT: {
          value: "7",
          selected: m === "7",
        },
        TRACE: {
          value: "8",
          selected: m === "8",
        },
      },
      is_disabled: !this.opts.IsCustomizable,
      onChangeHandler: (_: string, value: string) => {
        this.opts.Method = parseInt(value);
      },
    };
    const wui_request_method = new WuiInputSelect(select_opts);

    const path_opts: WuiInputStringOpts = {
      label: wui_request_method.el,
      value: this.opts.Path,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_disabled: !this.opts.IsCustomizable,
      onChangeHandler: (path: string) => {
        this.opts.Path = path;
      },
    };
    const wui_request_path = new WuiInputString(path_opts);

    parent.appendChild(wui_request_path.el);
  }

  private generateRequestContentType(parent: HTMLElement) {
    const ct = "" + this.opts.RequestType;
    const select_opts: WuiInputSelectOpts = {
      label: "Content type",
      name: "",
      options: {
        "(none)": {
          value: "0",
          selected: ct === "0",
        },
        "(query)": {
          value: "1",
          selected: ct === "1",
        },
        "application/x-www-form-urlencoded": {
          value: "2",
          selected: ct === "2",
        },
        "multipart/form-data": {
          value: "3",
          selected: ct === "3",
        },
        "application/json": {
          value: "4",
          selected: ct === "4",
        },
      },
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_disabled: !this.opts.IsCustomizable,
      onChangeHandler: (_: string, value: string) => {
        this.opts.RequestType = parseInt(value);
      },
    };
    const wui_request_type = new WuiInputSelect(select_opts);

    parent.appendChild(wui_request_type.el);
  }

  private generateRequestHeaders(parent: HTMLElement) {
    if (!this.opts.Headers) {
      return;
    }
    if (Object.keys(this.opts.Headers).length === 0) {
      return;
    }

    const wrapper = document.createElement("fieldset");
    wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_HEADER);

    const legend = document.createElement("legend");
    legend.innerText = "Headers";
    wrapper.appendChild(legend);

    for (const [key, fi] of Object.entries(this.opts.Headers)) {
      fi.value = LoadHttpTargetHeader(this.target, this.opts, key);
      GenerateFormInput(wrapper, fi);
    }

    parent.appendChild(wrapper);
  }

  private generateRequestParameters(parent: HTMLElement) {
    if (!this.opts.Params) {
      return;
    }
    if (Object.keys(this.opts.Params).length === 0) {
      return;
    }

    const wrapper = document.createElement("fieldset");
    wrapper.classList.add(CLASS_HTTP_TARGET_INPUT_PARAMS);

    const title = document.createElement("legend");
    title.innerText = "Parameters";
    wrapper.appendChild(title);

    for (const [key, fi] of Object.entries(this.opts.Params)) {
      fi.value = LoadHttpTargetParam(this.target, this.opts, key);
      GenerateFormInput(wrapper, fi);
    }

    parent.appendChild(wrapper);
  }

  private generateOutput(parent: HTMLElement) {
    const wrapper = document.createElement("fieldset");
    wrapper.classList.add(CLASS_HTTP_TARGET_OUT_RUN);

    const title = document.createElement("legend");
    title.innerText = "Run output";

    const btn_clear = document.createElement("button");
    btn_clear.innerText = "Clear";
    btn_clear.onclick = () => {
      this.onClickClearOutput();
    };
    title.appendChild(btn_clear);

    this.el_out_request.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
    this.el_out_response.classList.add(CLASS_HTTP_TARGET_OUT_MONO);
    this.el_out_response_body.classList.add(CLASS_HTTP_TARGET_OUT_MONO);

    wrapper.appendChild(title);
    wrapper.appendChild(this.el_out_request);
    wrapper.appendChild(this.el_out_response);
    wrapper.appendChild(this.el_out_response_body);

    parent.appendChild(wrapper);
    this.onClickClearOutput();
  }

  private generateOutputAttack(parent: HTMLElement) {
    if (!this.opts.AllowAttack) {
      return;
    }

    this.el_out_attack.classList.add(CLASS_HTTP_TARGET_OUT_ATTACK);

    const title = document.createElement("legend");
    title.innerText = "Attack results";

    this.generateAttackResults(this.el_out_attack_results);

    this.el_out_attack.appendChild(title);
    this.el_out_attack.appendChild(this.el_out_attack_results);
    parent.appendChild(this.el_out_attack);
  }

  private generateAttackResults(parent: HTMLElement) {
    parent.innerText = "";

    if (!this.opts.Results) {
      return;
    }

    for (const result of this.opts.Results) {
      const wrapper = document.createElement("div");
      wrapper.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT);

      const el_report_text = document.createElement("div");
      el_report_text.style.display = "none";
      el_report_text.classList.add(CLASS_HTTP_TARGET_OUT_MONO);

      const el_report_hist = document.createElement("div");
      el_report_hist.style.display = "none";
      el_report_hist.classList.add(CLASS_HTTP_TARGET_OUT_MONO);

      const el = document.createElement("div");
      el.innerText = result.Name;

      const actions = document.createElement("span");
      actions.classList.add(CLASS_HTTP_TARGET_ATTACK_RESULT_ACTIONS);

      const btn_attack_show = document.createElement("button");
      btn_attack_show.innerText = "Show";
      btn_attack_show.onclick = () => {
        this.onClickAttackShow(
          result.Name,
          btn_attack_show,
          el_report_text,
          el_report_hist,
        );
      };

      const btn_attack_del = document.createElement("button");
      btn_attack_del.innerText = "Delete";
      btn_attack_del.onclick = () => {
        this.onClickAttackDelete(result);
      };

      actions.appendChild(btn_attack_show);
      actions.appendChild(btn_attack_del);
      el.appendChild(actions);

      wrapper.appendChild(el);
      wrapper.appendChild(el_report_text);
      wrapper.appendChild(el_report_hist);

      parent.appendChild(wrapper);
    }
  }

  private async onClickAttack() {
    await this.trunks.AttackHttp(this.target, this.opts);
  }

  private async onClickAttackDelete(result: AttackResult) {
    const res = await this.trunks.AttackHttpDelete(result.Name);
    if (!res) {
      return;
    }
    this.opts.Results.forEach((r: AttackResult, x: number) => {
      if (r.Name == result.Name) {
        this.opts.Results.splice(x, 1);
        this.generateAttackResults(this.el_out_attack_results);
        return;
      }
    });
  }

  private async onClickAttackShow(
    result_name: string,
    btn: HTMLButtonElement,
    el_report_text: HTMLElement,
    el_report_hist: HTMLElement,
  ) {
    if (btn.innerText === "Hide") {
      btn.innerText = "Show";
      el_report_text.style.display = "none";
      el_report_hist.style.display = "none";
      return;
    }

    const res_json = await this.trunks.AttackHttpGet(result_name);
    if (res_json.code != 200) {
      return;
    }

    const res = res_json.data as AttackResult;

    el_report_text.innerText = atob(res.TextReport);
    el_report_text.style.display = "block";

    el_report_hist.innerText = atob(res.HistReport);
    el_report_hist.style.display = "block";

    btn.innerText = "Hide";
  }

  private async onClickClearOutput() {
    this.el_out_request.innerText = "Raw request";
    this.el_out_response.innerText = "Raw response";
    this.el_out_response_body.innerText = "JSON formatted response body";
  }

  private async onClickRun() {
    const res = await this.trunks.RunHttp(this.target, this.opts);
    if (!res) {
      return;
    }
    this.el_out_request.innerText = atob(res.DumpRequest);
    this.el_out_response.innerText = atob(res.DumpResponse);
    const body = atob(res.ResponseBody);
    if (res.ResponseType === CONTENT_TYPE_JSON) {
      this.el_out_response_body.innerText = JSON.stringify(
        JSON.parse(body),
        null,
        2,
      );
    } else {
      this.el_out_response_body.innerText = body;
    }
  }

  AddAttackResult(result: AttackResult) {
    this.opts.Results.push(result);
    this.generateAttackResults(this.el_out_attack_results);
  }
}
