// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  WuiInputString,
  WuiInputStringOpts,
} from "./pakakeh_ts/input/string.js";
import {
  WuiInputNumber,
  WuiInputNumberOpts,
} from "./pakakeh_ts/input/number.js";

import {
  CLASS_INPUT,
  CLASS_INPUT_LABEL,
  CLASS_NAV_TARGET,
  HASH_ENVIRONMENT,
  EnvironmentInterface,
  GorankusuInterface,
} from "./interface.js";

export class Environment {
  elNav: HTMLElement = document.createElement("h3");
  elContent: HTMLElement = document.createElement("div");

  comListenAddress!: WuiInputString;
  comMaxAttackDur!: WuiInputNumber;
  comMaxAttackRate!: WuiInputNumber;
  comResultsDir!: WuiInputString;
  comResultsSuffix!: WuiInputString;

  constructor(
    public gorankusu: GorankusuInterface,
    public opts: EnvironmentInterface,
  ) {
    this.elNav.classList.add(CLASS_NAV_TARGET);
    this.elNav.innerText = "Environment";
    this.elNav.onclick = () => {
      gorankusu.setContent(HASH_ENVIRONMENT, this.elContent);
    };

    this.generateContent();
  }

  private generateContent() {
    const elTitle = document.createElement("h2");
    elTitle.innerText = "Environment";

    const optsListenAddress: WuiInputStringOpts = {
      label: "Listen address",
      hint: "The address and port where Gorankusu is running.",
      value: this.opts.ListenAddress,
      is_disabled: true,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: string) => {
        this.opts.ListenAddress = v;
      },
    };
    this.comListenAddress = new WuiInputString(optsListenAddress);

    const optsMaxAttackDur: WuiInputNumberOpts = {
      label: "Max. attack duration (seconds)",
      hint: "Maximum attack duration for all targets, in seconds.",
      value: this.opts.MaxAttackDuration / 1e9,
      min: 1,
      is_disabled: true,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.MaxAttackDuration = v * 1e9;
      },
    };
    this.comMaxAttackDur = new WuiInputNumber(optsMaxAttackDur);

    const optsMaxAttackRate: WuiInputNumberOpts = {
      label: "Max. attack rate",
      hint: "Maximum attack rate for all targets.",
      value: this.opts.MaxAttackRate,
      min: 1,
      is_disabled: true,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: number) => {
        this.opts.MaxAttackRate = v;
      },
    };
    this.comMaxAttackRate = new WuiInputNumber(optsMaxAttackRate);

    const optsResultsDir: WuiInputStringOpts = {
      label: "Results directory",
      hint: "The directory where the attack result will be saved.",
      value: this.opts.ResultsDir,
      is_disabled: true,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: string) => {
        this.opts.ResultsDir = v;
      },
    };
    this.comResultsDir = new WuiInputString(optsResultsDir);

    const optsResultsSuffix: WuiInputStringOpts = {
      label: "Results suffix",
      hint: "Optional suffix for the file name of attack result.",
      value: this.opts.ResultsSuffix,
      is_disabled: true,
      class_input: CLASS_INPUT,
      class_label: CLASS_INPUT_LABEL,
      is_hint_toggled: true,
      onChangeHandler: (v: string) => {
        this.opts.ResultsSuffix = v;
      },
    };
    this.comResultsSuffix = new WuiInputString(optsResultsSuffix);

    this.elContent.appendChild(elTitle);
    this.elContent.appendChild(this.comListenAddress.el);
    this.elContent.appendChild(this.comMaxAttackDur.el);
    this.elContent.appendChild(this.comMaxAttackRate.el);
    this.elContent.appendChild(this.comResultsDir.el);
    this.elContent.appendChild(this.comResultsSuffix.el);
  }

  set(opts: EnvironmentInterface) {
    this.opts = opts;

    this.comListenAddress.set(opts.ListenAddress);
    this.comMaxAttackDur.set(opts.MaxAttackDuration / 1e9);
    this.comMaxAttackRate.set(opts.MaxAttackRate);
    this.comResultsDir.set(opts.ResultsDir);
    this.comResultsSuffix.set(opts.ResultsSuffix);
  }
}
