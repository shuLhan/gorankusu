// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js";
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js";

import {
  GenerateFormInput,
  LoadTargetOptDuration,
  LoadTargetOptRatePerSecond,
  LoadTargetOptTimeout,
  LoadTargetVar,
} from "./functions.js";
import {
  CLASS_INPUT,
  CLASS_INPUT_LABEL,
  CLASS_NAV_TARGET,
  HttpTargetInterface,
  TargetInterface,
  TrunksInterface,
  WebSocketTargetInterface,
} from "./interface.js";
import { HttpTarget } from "./http_target.js";
import { WebSocketTarget } from "./ws_target.js";

const CLASS_NAV_TARGET_HTTP = "nav_http_target";
const CLASS_NAV_TARGET_WS = "nav_ws_target";

interface MapHttpTarget {
  [key: string]: HttpTarget;
}

interface MapWebSocketTarget {
  [key: string]: WebSocketTarget;
}

export class Target {
  el_nav: HTMLElement = document.createElement("div");
  el_content: HTMLElement = document.createElement("div");

  http_targets: MapHttpTarget = {};
  ws_targets: MapWebSocketTarget = {};

  constructor(
    public trunks: TrunksInterface,
    public opts: TargetInterface,
  ) {
    this.generateNav(trunks);
    this.generateContent(trunks);
  }

  private generateNav(trunks: TrunksInterface) {
    this.el_nav.classList.add(CLASS_NAV_TARGET);

    const el_target_menu = document.createElement("h3");
    el_target_menu.innerHTML = this.opts.Name;
    el_target_menu.onclick = () => {
      trunks.ContentRenderer(this.opts, null, null, null, this.el_content);
    };

    this.el_nav.appendChild(el_target_menu);

    if (this.opts.HttpTargets) {
      for (const ht of this.opts.HttpTargets) {
        const el_target_http = document.createElement("div");
        el_target_http.innerHTML = ht.Name;
        el_target_http.id = `/http/${this.opts.ID}/${ht.ID}`;
        el_target_http.classList.add(CLASS_NAV_TARGET_HTTP);
        el_target_http.onclick = () => {
          trunks.ContentRenderer(this.opts, ht, null, null, this.el_content);
        };
        this.el_nav.appendChild(el_target_http);
      }
    }

    if (this.opts.WebSocketTargets) {
      for (const wst of this.opts.WebSocketTargets) {
        const el_target_ws = document.createElement("div");
        el_target_ws.innerHTML = wst.Name;
        el_target_ws.id = `/ws/${this.opts.ID}/${wst.ID}`;
        el_target_ws.classList.add(CLASS_NAV_TARGET_WS);
        el_target_ws.onclick = () => {
          trunks.ContentRenderer(this.opts, null, wst, null, this.el_content);
        };
        this.el_nav.appendChild(el_target_ws);
      }
    }
  }

  private generateContent(trunks: TrunksInterface) {
    this.generateContentBaseURL();
    this.generateContentAttackOptions();
    this.generateContentVars();
    this.generateHttpTargets(trunks);
    this.generateWebSocketTargets(trunks);
  }

  private generateContentBaseURL() {
    const hdr_target = document.createElement("h2");
    hdr_target.innerText = this.opts.Name;
    hdr_target.id = this.opts.ID;

    const el_hint = document.createElement("p");
    el_hint.innerHTML = this.opts.Hint || "";

    const opts_base_url: WuiInputStringOpts = {
      label: "Base URL",
      hint: "The base URL where the HTTP request will be send or the target of attack.",
      value: this.opts.BaseUrl,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      is_disabled: true,
      onChangeHandler: (v: string) => {
        this.opts.BaseUrl = v;
      },
    };
    const com_input_base_url = new WuiInputString(opts_base_url);

    this.el_content.appendChild(hdr_target);
    if (this.opts.Hint) {
      this.el_content.appendChild(el_hint);
    }
    this.el_content.appendChild(com_input_base_url.el);
  }

  private generateContentAttackOptions() {
    const wrapper = document.createElement("fieldset");

    const legend = document.createElement("legend");
    legend.innerText = "Attack options";

    const opts_duration: WuiInputNumberOpts = {
      label: "Duration",
      hint: "The duration of attack, in seconds.",
      value: LoadTargetOptDuration(this.opts),
      min: 1,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.Opts.Duration = v * 1e9;
      },
    };
    const com_input_duration = new WuiInputNumber(opts_duration);

    const opts_rate: WuiInputNumberOpts = {
      label: "Rate per second",
      hint: "The number of request send per second when attacking target.",
      value: LoadTargetOptRatePerSecond(this.opts),
      min: 1,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.Opts.RatePerSecond = v;
      },
    };
    const com_input_rate = new WuiInputNumber(opts_rate);

    const opts_timeout: WuiInputNumberOpts = {
      label: "Timeout (seconds)",
      hint: "Timeout for each request, in seconds.",
      value: LoadTargetOptTimeout(this.opts),
      min: 5,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.Opts.Timeout = v * 1e9;
      },
    };
    const com_input_timeout = new WuiInputNumber(opts_timeout);

    wrapper.appendChild(legend);
    wrapper.appendChild(com_input_duration.el);
    wrapper.appendChild(com_input_rate.el);
    wrapper.appendChild(com_input_timeout.el);
    this.el_content.appendChild(wrapper);
  }

  private generateContentVars() {
    if (!this.opts.Vars) {
      return;
    }

    const wrapper = document.createElement("fieldset");

    const legend = document.createElement("legend");
    legend.innerText = "Variables";
    wrapper.appendChild(legend);

    for (const [key, fi] of Object.entries(this.opts.Vars)) {
      fi.value = LoadTargetVar(this.opts, key);
      GenerateFormInput(wrapper, fi);
    }

    this.el_content.appendChild(wrapper);
  }

  private generateHttpTargets(trunks: TrunksInterface) {
    if (!this.opts.HttpTargets) {
      return;
    }

    this.opts.HttpTargets.forEach((httpTarget: HttpTargetInterface) => {
      const com_http_target = new HttpTarget(trunks, this.opts, httpTarget);
      this.http_targets[httpTarget.ID] = com_http_target;

      this.el_content.appendChild(com_http_target.el);
    });
  }

  private generateWebSocketTargets(trunks: TrunksInterface) {
    if (!this.opts.WebSocketTargets) {
      return;
    }

    this.opts.WebSocketTargets.forEach((wsTarget: WebSocketTargetInterface) => {
      const com_ws_target = new WebSocketTarget(trunks, this.opts, wsTarget);
      this.ws_targets[wsTarget.ID] = com_ws_target;

      this.el_content.appendChild(com_ws_target.el);
    });
  }
}
