// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

export const CLASS_INPUT_LABEL = "trunks_input_label";
export const CLASS_INPUT = "trunks_input";
export const CLASS_NAV_LINK = "nav_link";
export const CLASS_NAV_TARGET = "nav_target";

export const HASH_ENVIRONMENT = "environment";
export const HASH_LINKS = "links";

export const FormInputKindFile = "file";
export const FormInputKindNumber = "number";
export const FormInputKindString = "string";

export interface AttackOptionsInterface {
  Duration: number;
  RatePerSecond: number;
  Timeout: number;
}

export interface AttackResult {
  TargetID: string;
  HTTPTargetID: string;
  Name: string;
  TextReport: string;
  HistReport: string;
}

export interface EnvironmentInterface {
  ListenAddress: string;
  MaxAttackDuration: number;
  MaxAttackRate: number;
  ResultsDir: string;
  ResultsSuffix: string;
  AttackRunning: RunRequestInterface | null;
}

export interface FormInput {
  label: string;
  hint: string;
  kind: string;
  value: string;
  filename: string;
  filetype: string;
  filesize: number;
  filemodms: number;
  max?: number;
  min?: number;
}

export interface HTTPResponseInterface {
  code: number;
  message: string;
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface HTTPTargetInterface {
  Name: string;
  Hint?: string;
  ID: string;
  Method: number;
  Path: string;
  RequestType: number;
  Headers: KeyFormInput;
  Params: KeyFormInput;
  Results: AttackResult[];
  AllowAttack: boolean;
  IsCustomizable: boolean;
}

export interface KeyFormInput {
  [key: string]: FormInput;
}

export interface MapIdTarget {
  [key: string]: TargetInterface;
}

export interface MapNumberString {
  [key: number]: string;
}

export interface NavLinkInterface {
  ID: string;
  Text: string;
  Href: string;
  OpenInIFrame: boolean;
}

export interface RunRequestInterface {
  Target: TargetInterface;
  HTTPTarget: HTTPTargetInterface | null;
  WebSocketTarget: WebSocketTargetInterface | null;
  Result?: AttackResult | null;
}

export interface RunResponseInterface {
  DumpRequest: string;
  DumpResponse: string;
  ResponseStatus: string;
  ResponseStatusCode: number;
  ResponseType: string;
  ResponseBody: string;
}

export interface TargetInterface {
  ID: string;
  Name: string;
  Hint?: string;
  BaseURL: string;
  Opts: AttackOptionsInterface;
  Vars: KeyFormInput;
  HTTPTargets: HTTPTargetInterface[];
  WebSocketTargets: WebSocketTargetInterface[];
}

export interface TrunksInterface {
  attackHTTP(
    target: TargetInterface,
    http_target: HTTPTargetInterface,
  ): Promise<HTTPResponseInterface | null>;

  attackHTTPDelete(name: string): Promise<HTTPResponseInterface | null>;

  attackHTTPGet(name: string): Promise<HTTPResponseInterface>;

  contentRenderer(
    target: TargetInterface,
    http_target: HTTPTargetInterface | null,
    ws_target: WebSocketTargetInterface | null,
    nav_link: NavLinkInterface | null,
    el: HTMLElement,
  ): void;

  setContent(path: string, el: HTMLElement | null): void;

  runHTTP(
    target: TargetInterface,
    http_target: HTTPTargetInterface,
  ): Promise<RunResponseInterface | null>;

  runWebSocket(
    target: TargetInterface,
    WebSocketTargetInterface: WebSocketTargetInterface,
  ): Promise<HTTPResponseInterface | null>;
}

export interface WebSocketTargetInterface {
  ID: string;
  Name: string;
  Hint?: string;
  Headers: KeyFormInput;
  Params: KeyFormInput;
}
