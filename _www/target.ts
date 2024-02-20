// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js";
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js";

import {
  generateFormInput,
  loadTargetOptDuration,
  loadTargetOptRatePerSecond,
  loadTargetOptTimeout,
  loadTargetHeader,
  loadTargetVar,
} from "./functions.js";
import {
  CLASS_INPUT,
  CLASS_INPUT_LABEL,
  CLASS_NAV_TARGET,
  HTTPTargetInterface,
  TargetInterface,
  GorankusuInterface,
  WebSocketTargetInterface,
} from "./interface.js";
import { HTTPTarget } from "./http_target.js";
import { WebSocketTarget } from "./ws_target.js";

const CLASS_NAV_TARGET_HTTP = "nav_http_target";
const CLASS_NAV_TARGET_WS = "nav_ws_target";

interface MapHTTPTarget {
  [key: string]: HTTPTarget;
}

interface MapWebSocketTarget {
  [key: string]: WebSocketTarget;
}

export class Target {
  elNav: HTMLElement = document.createElement("div");
  elContent: HTMLElement = document.createElement("div");

  http_targets: MapHTTPTarget = {};
  ws_targets: MapWebSocketTarget = {};

  constructor(
    public gorankusu: GorankusuInterface,
    public opts: TargetInterface,
  ) {
    this.generateNav(gorankusu);
    this.generateContent(gorankusu);
  }

  private generateNav(gorankusu: GorankusuInterface) {
    this.elNav.classList.add(CLASS_NAV_TARGET);

    const elTargetMenu = document.createElement("h3");
    elTargetMenu.innerHTML = this.opts.Name;
    elTargetMenu.onclick = () => {
      gorankusu.contentRenderer(this.opts, null, null, null, this.elContent);
    };

    this.elNav.appendChild(elTargetMenu);

    if (this.opts.HTTPTargets) {
      for (const ht of this.opts.HTTPTargets) {
        const elTargetHTTP = document.createElement("div");
        elTargetHTTP.innerHTML = ht.Name;
        elTargetHTTP.id = `/http/${this.opts.ID}/${ht.ID}`;
        elTargetHTTP.classList.add(CLASS_NAV_TARGET_HTTP);
        elTargetHTTP.onclick = () => {
          gorankusu.contentRenderer(this.opts, ht, null, null, this.elContent);
        };
        this.elNav.appendChild(elTargetHTTP);
      }
    }

    if (this.opts.WebSocketTargets) {
      for (const wst of this.opts.WebSocketTargets) {
        const elTargetWS = document.createElement("div");
        elTargetWS.innerHTML = wst.Name;
        elTargetWS.id = `/ws/${this.opts.ID}/${wst.ID}`;
        elTargetWS.classList.add(CLASS_NAV_TARGET_WS);
        elTargetWS.onclick = () => {
          gorankusu.contentRenderer(this.opts, null, wst, null, this.elContent);
        };
        this.elNav.appendChild(elTargetWS);
      }
    }
  }

  private generateContent(gorankusu: GorankusuInterface) {
    this.generateContentBaseURL();
    this.generateContentAttackOptions();
    this.generateContentHeaders();
    this.generateContentVars();
    this.generateHTTPTargets(gorankusu);
    this.generateWebSocketTargets(gorankusu);
  }

  private generateContentBaseURL() {
    const hdrTarget = document.createElement("h2");
    hdrTarget.innerText = this.opts.Name;
    hdrTarget.id = this.opts.ID;

    const elHint = document.createElement("p");
    elHint.innerHTML = this.opts.Hint || "";

    const optsBaseURL: WuiInputStringOpts = {
      label: "Base URL",
      hint: "The base URL where the HTTP request will be send or the target of attack.",
      value: this.opts.BaseURL,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      is_disabled: true,
      onChangeHandler: (v: string) => {
        this.opts.BaseURL = v;
      },
    };
    const comInputBaseURL = new WuiInputString(optsBaseURL);

    this.elContent.appendChild(hdrTarget);
    if (this.opts.Hint) {
      this.elContent.appendChild(elHint);
    }
    this.elContent.appendChild(comInputBaseURL.el);
  }

  private generateContentAttackOptions() {
    const wrapper = document.createElement("fieldset");

    const legend = document.createElement("legend");
    legend.innerText = "Attack options";

    const optsDuration: WuiInputNumberOpts = {
      label: "Duration",
      hint: "The duration of attack, in seconds.",
      value: loadTargetOptDuration(this.opts),
      min: 1,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.Opts.Duration = v * 1e9;
      },
    };
    const comInputDuration = new WuiInputNumber(optsDuration);

    const optsRate: WuiInputNumberOpts = {
      label: "Rate per second",
      hint: "The number of request send per second when attacking target.",
      value: loadTargetOptRatePerSecond(this.opts),
      min: 1,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.Opts.RatePerSecond = v;
      },
    };
    const comInputRate = new WuiInputNumber(optsRate);

    const optsTimeout: WuiInputNumberOpts = {
      label: "Timeout (seconds)",
      hint: "Timeout for each request, in seconds.",
      value: loadTargetOptTimeout(this.opts),
      min: 5,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.Opts.Timeout = v * 1e9;
      },
    };
    const comInputTimeout = new WuiInputNumber(optsTimeout);

    wrapper.appendChild(legend);
    wrapper.appendChild(comInputDuration.el);
    wrapper.appendChild(comInputRate.el);
    wrapper.appendChild(comInputTimeout.el);
    this.elContent.appendChild(wrapper);
  }

  private generateContentHeaders() {
    if (!this.opts.Headers) {
      return;
    }

    const wrapper = document.createElement("fieldset");

    const legend = document.createElement("legend");
    legend.innerText = "Headers";
    wrapper.appendChild(legend);

    for (const [key, fi] of Object.entries(this.opts.Headers)) {
      fi.value = loadTargetHeader(this.opts, key);
      generateFormInput(wrapper, fi);
    }

    this.elContent.appendChild(wrapper);
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
      fi.value = loadTargetVar(this.opts, key);
      generateFormInput(wrapper, fi);
    }

    this.elContent.appendChild(wrapper);
  }

  private generateHTTPTargets(gorankusu: GorankusuInterface) {
    if (!this.opts.HTTPTargets) {
      return;
    }

    this.opts.HTTPTargets.forEach((httpTarget: HTTPTargetInterface) => {
      const comHTTPTarget = new HTTPTarget(gorankusu, this.opts, httpTarget);
      this.http_targets[httpTarget.ID] = comHTTPTarget;

      this.elContent.appendChild(comHTTPTarget.el);
    });
  }

  private generateWebSocketTargets(gorankusu: GorankusuInterface) {
    if (!this.opts.WebSocketTargets) {
      return;
    }

    this.opts.WebSocketTargets.forEach((wsTarget: WebSocketTargetInterface) => {
      const comWSTarget = new WebSocketTarget(gorankusu, this.opts, wsTarget);
      this.ws_targets[wsTarget.ID] = comWSTarget;

      this.elContent.appendChild(comWSTarget.el);
    });
  }
}
