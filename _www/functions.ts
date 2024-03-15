// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

import { WuiInputFile } from "./wui/input/file.js";
import { WuiInputNumber, WuiInputNumberOpts } from "./wui/input/number.js";
import { WuiInputString, WuiInputStringOpts } from "./wui/input/string.js";

import {
  CLASS_INPUT,
  CLASS_INPUT_LABEL,
  FormInput,
  FormInputKindFile,
  FormInputKindNumber,
  HTTPTargetInterface,
  TargetInterface,
  WebSocketTargetInterface,
} from "./interface.js";

export function getDocumentHeight() {
  const D = document;
  return Math.max(
    Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
    Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
    Math.max(D.body.clientHeight, D.documentElement.clientHeight),
  );
}

export function generateFormInput(parent: HTMLElement, fi: FormInput) {
  let wuiInputNumberOpts: WuiInputNumberOpts;
  let wuiInputStringOpts: WuiInputStringOpts;
  let wuiInputNumber: WuiInputNumber;
  let wuiInputString: WuiInputString;
  let wuiInputFile: WuiInputFile;
  let reader: FileReader;

  switch (fi.kind) {
    case FormInputKindFile:
      wuiInputFile = new WuiInputFile();
      wuiInputFile.label = fi.label;
      wuiInputFile.hint = fi.hint;
      wuiInputFile.classInput = CLASS_INPUT;
      wuiInputFile.classLabel = CLASS_INPUT_LABEL;
      wuiInputFile.onChange = (file: File) => {
        fi.filename = file.name;
        fi.filetype = file.type;
        fi.filesize = file.size;
        fi.filemodms = file.lastModified;
        fi.value = "";

        reader = new FileReader();
        reader.onload = (e) => {
          if (e) {
            fi.value = btoa(reader.result as string);
          }
        };
        reader.readAsText(file);
      };
      parent.appendChild(wuiInputFile.element());
      break;

    case FormInputKindNumber:
      wuiInputNumberOpts = {
        label: fi.label,
        hint: fi.hint,
        value: +fi.value,
        class_input: CLASS_INPUT,
        class_label: CLASS_INPUT_LABEL,
        is_hint_toggled: true,
        onChangeHandler: (newValue: number) => {
          fi.value = "" + newValue;
        },
      };
      if (fi.max) {
        wuiInputNumberOpts.max = fi.max;
      }
      if (fi.min) {
        wuiInputNumberOpts.min = fi.min;
      }
      wuiInputNumber = new WuiInputNumber(wuiInputNumberOpts);
      parent.appendChild(wuiInputNumber.el);
      break;

    default:
      wuiInputStringOpts = {
        label: fi.label,
        hint: fi.hint,
        value: fi.value,
        class_input: CLASS_INPUT,
        class_label: CLASS_INPUT_LABEL,
        is_hint_toggled: true,
        onChangeHandler: (newValue: string) => {
          fi.value = newValue;
        },
      };
      wuiInputString = new WuiInputString(wuiInputStringOpts);
      parent.appendChild(wuiInputString.el);
      break;
  }
}

//
// loadHTTPTargetHeader get HTTPTarget header from local storage by key.
// If no header exist in storage return the one from HTTPTarget itself.
//
export function loadHTTPTargetHeader(
  target: TargetInterface,
  httpTarget: HTTPTargetInterface,
  key: string,
): string {
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

function saveHTTPTargetHeader(
  target: TargetInterface,
  httpTarget: HTTPTargetInterface,
  key: string,
  value: string,
) {
  const storageKey = `${target.ID}.http.${httpTarget.ID}.header.${key}`;
  window.localStorage.setItem(storageKey, value);
}

//
// loadHTTPTargetParam get HTTPTarget parameter from local storage by key.
// If no parameter exist in storage return the one from HTTPTarget itself.
//
export function loadHTTPTargetParam(
  target: TargetInterface,
  httpTarget: HTTPTargetInterface,
  key: string,
): string {
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

function saveHTTPTargetParam(
  target: TargetInterface,
  httpTarget: HTTPTargetInterface,
  key: string,
  value: string,
) {
  const storageKey = `${target.ID}.http.${httpTarget.ID}.param.${key}`;
  window.localStorage.setItem(storageKey, value);
}

export function loadTargetOptDuration(target: TargetInterface): number {
  const storageKey = `${target.ID}.opt.Duration`;
  const val = window.localStorage.getItem(storageKey);
  if (val) {
    return +val / 1e9;
  }
  return target.Opts.Duration / 1e9;
}

function saveTargetOptDuration(target: TargetInterface) {
  const storageKey = `${target.ID}.opt.Duration`;
  window.localStorage.setItem(storageKey, "" + target.Opts.Duration);
}

export function loadTargetOptRatePerSecond(target: TargetInterface): number {
  const storageKey = `${target.ID}.opt.RatePerSecond`;
  const val = window.localStorage.getItem(storageKey);
  if (val) {
    return +val;
  }
  return target.Opts.RatePerSecond;
}

function saveTargetOptRatePerSecond(target: TargetInterface) {
  const storageKey = `${target.ID}.opt.RatePerSecond`;
  window.localStorage.setItem(storageKey, "" + target.Opts.RatePerSecond);
}

export function loadTargetOptTimeout(target: TargetInterface): number {
  const storageKey = `${target.ID}.opt.Timeout`;
  const val = window.localStorage.getItem(storageKey);
  if (val) {
    return +val / 1e9;
  }
  return target.Opts.Timeout / 1e9;
}

function saveTargetOptTimeout(target: TargetInterface) {
  const storageKey = `${target.ID}.opt.Timeout`;
  window.localStorage.setItem(storageKey, "" + target.Opts.Timeout);
}

// loadTargetHeader get target header from local storage or return the
// original value.
export function loadTargetHeader(target: TargetInterface, key: string): string {
  const storageKey = `${target.ID}.header.${key}`;
  const val = window.localStorage.getItem(storageKey);
  if (val) {
    return val;
  }
  const tvar = target.Headers[key];
  if (tvar) {
    return tvar.value;
  }
  return "";
}

function saveTargetHeader(target: TargetInterface, key: string, value: string) {
  const storageKey = `${target.ID}.header.${key}`;
  window.localStorage.setItem(storageKey, value);
}

//
// loadTargetVar get target variable from local storage or return the original
// value.
//
export function loadTargetVar(target: TargetInterface, key: string): string {
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

function saveTargetVar(target: TargetInterface, key: string, value: string) {
  const storageKey = `${target.ID}.var.${key}`;
  window.localStorage.setItem(storageKey, value);
}

//
// loadWsTargetHeader get the WebSocketTarget from local storage by key.
//
export function loadWsTargetHeader(
  target: TargetInterface,
  wsTarget: WebSocketTargetInterface,
  key: string,
): string {
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

function saveWsTargetHeader(
  target: TargetInterface,
  wsTarget: WebSocketTargetInterface,
  key: string,
  value: string,
) {
  const storageKey = `${target.ID}.ws.${wsTarget.ID}.header.${key}`;
  window.localStorage.setItem(storageKey, value);
}

//
// loadWsTargetParam get the WebSocketTarget parameter from local storage or
// return the one from wsTarget if its not exist.
//
export function loadWsTargetParam(
  target: TargetInterface,
  wsTarget: WebSocketTargetInterface,
  key: string,
): string {
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

function saveWsTargetParam(
  target: TargetInterface,
  wsTarget: WebSocketTargetInterface,
  key: string,
  value: string,
) {
  const storageKey = `${target.ID}.ws.${wsTarget.ID}.param.${key}`;
  window.localStorage.setItem(storageKey, value);
}

//
// save the variables on the Target, Params and Headers on HTTPTarget or
// WebSocket to local storage.
//
export function save(
  target: TargetInterface,
  httpTarget: HTTPTargetInterface | null,
  wsTarget: WebSocketTargetInterface | null,
) {
  saveTargetOptDuration(target);
  saveTargetOptRatePerSecond(target);
  saveTargetOptTimeout(target);

  for (const [k, fi] of Object.entries(target.Headers)) {
    saveTargetHeader(target, k, fi.value);
  }
  for (const [k, fi] of Object.entries(target.Vars)) {
    saveTargetVar(target, k, fi.value);
  }
  if (httpTarget) {
    for (const [k, fi] of Object.entries(httpTarget.Headers)) {
      saveHTTPTargetHeader(target, httpTarget, k, fi.value);
    }
    for (const [k, fi] of Object.entries(httpTarget.Params)) {
      saveHTTPTargetParam(target, httpTarget, k, fi.value);
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
