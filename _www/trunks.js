// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Environment } from "./environment.js";
import { Save } from "./functions.js";
import { HASH_ENVIRONMENT, } from "./interface.js";
import { NavLinks } from "./nav_links.js";
import { Target } from "./target.js";
import { wui_notif } from "./vars.js";
const API_ATTACK_HTTP = "/_trunks/api/attack/http";
const API_ATTACK_RESULT = "/_trunks/api/attack/result";
const API_ENVIRONMENT = "/_trunks/api/environment";
const API_NAVLINKS = "/_trunks/api/navlinks";
const API_TARGETS = "/_trunks/api/targets";
const API_TARGET_RUN_HTTP = "/_trunks/api/target/run/http";
const API_TARGET_RUN_WEBSOCKET = "/_trunks/api/target/run/websocket";
const CLASS_ATTACK_RUNNING = "trunks_attack_running";
const CLASS_FOOTER = "trunks_footer";
const CLASS_MAIN = "trunks_main";
const CLASS_NAV = "trunks_nav";
export class Trunks {
    constructor() {
        this.env = {
            ListenAddress: "",
            MaxAttackDuration: 0,
            MaxAttackRate: 0,
            ResultsDir: "",
            ResultsSuffix: "",
            AttackRunning: null,
        };
        this.targets = {};
        this.navLinks = {};
        this.el = document.createElement("div");
        this.com_env = new Environment(this, this.env);
        this.generateNav();
        this.generateContent();
        document.body.appendChild(this.el);
    }
    generateNav() {
        let el_nav = document.createElement("div");
        el_nav.classList.add(CLASS_NAV);
        this.el_ws_conn_status = document.createElement("div");
        let fs_attack_running = document.createElement("fieldset");
        let legend = document.createElement("legend");
        legend.innerText = "Attack running";
        this.el_attack_running = document.createElement("span");
        this.el_attack_running.classList.add(CLASS_ATTACK_RUNNING);
        this.el_nav_content = document.createElement("div");
        this.el_nav_links = document.createElement("div");
        let el_nav_footer = document.createElement("div");
        el_nav_footer.classList.add(CLASS_FOOTER);
        el_nav_footer.innerHTML = `
			<div>
				<div>Powered by <a href="https://sr.ht/~shulhan/trunks" target="_blank">Trunks</a></div>
				<div><a href="/doc/" target="_blank">Documentation</a></div>
			</div>
		`;
        el_nav.appendChild(this.el_ws_conn_status);
        fs_attack_running.appendChild(legend);
        fs_attack_running.appendChild(this.el_attack_running);
        el_nav.appendChild(fs_attack_running);
        el_nav.appendChild(this.com_env.el_nav);
        el_nav.appendChild(this.el_nav_content);
        el_nav.appendChild(document.createElement("hr"));
        el_nav.appendChild(this.el_nav_links);
        el_nav.appendChild(el_nav_footer);
        this.el.appendChild(el_nav);
    }
    generateContent() {
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_MAIN);
        this.el_attack_cancel = document.createElement("button");
        this.el_attack_cancel.innerHTML = "Cancel";
        this.el_content = document.createElement("div");
        wrapper.appendChild(this.el_content);
        this.el.appendChild(wrapper);
    }
    Init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.apiEnvironmentGet();
            yield this.initTargets();
            yield this.initNavLinks();
            this.windowOnHashChange();
            window.onhashchange = () => {
                this.windowOnHashChange();
            };
        });
    }
    apiEnvironmentGet() {
        return __awaiter(this, void 0, void 0, function* () {
            let http_res = yield fetch(API_ENVIRONMENT);
            let res = yield http_res.json();
            if (res.code != 200) {
                wui_notif.Error(res.message);
                return;
            }
            this.env = res.data;
            this.setAttackRunning(this.env.AttackRunning);
            this.com_env.Set(this.env);
        });
    }
    initNavLinks() {
        return __awaiter(this, void 0, void 0, function* () {
            let http_res = yield fetch(API_NAVLINKS);
            let res = yield http_res.json();
            if (res.code != 200) {
                wui_notif.Error(res.message);
                return;
            }
            this.com_nav_links = new NavLinks(this, res.data);
            this.el_nav_links.appendChild(this.com_nav_links.el_nav);
            for (let nav of res.data) {
                this.navLinks[nav.ID] = nav;
            }
        });
    }
    initTargets() {
        return __awaiter(this, void 0, void 0, function* () {
            let http_res = yield fetch(API_TARGETS);
            let res = yield http_res.json();
            if (res.code != 200) {
                wui_notif.Error(res.message);
                return;
            }
            let targets = res.data;
            this.el_nav_content.innerHTML = "";
            for (let target of targets) {
                let com_target = new Target(this, target);
                this.targets[target.ID] = com_target;
                this.el_nav_content.appendChild(com_target.el_nav);
            }
        });
    }
    onClickAttackCancel() {
        return __awaiter(this, void 0, void 0, function* () {
            let fres = yield fetch(API_ATTACK_HTTP, {
                method: "DELETE",
            });
            let json_res = yield fres.json();
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
                return null;
            }
            wui_notif.Info(json_res.message);
            this.setAttackRunning(null);
            return json_res;
        });
    }
    windowOnHashChange() {
        // Parse the location hash.
        let path = window.location.hash.substring(1);
        let paths = path.split("/");
        if (paths.length < 2) {
            return;
        }
        if (paths[1] === HASH_ENVIRONMENT) {
            this.el_content.innerHTML = "";
            this.el_content.appendChild(this.com_env.el_content);
            return;
        }
        console.log("paths: ", paths);
        let el;
        let target = this.targets[paths[1]];
        switch (paths.length) {
            case 2:
            case 3:
                if (target) {
                    this.el_content.innerHTML = "";
                    this.el_content.appendChild(target.el_content);
                    el = document.getElementById(paths[1]);
                    if (el) {
                        el.scrollIntoView();
                    }
                }
                break;
            case 4:
                if (paths[2] === "http") {
                    this.el_content.innerHTML = "";
                    this.el_content.appendChild(target.el_content);
                }
                else if (paths[2] === "ws") {
                    this.el_content.innerHTML = "";
                    this.el_content.appendChild(target.el_content);
                }
                else if (paths[2] === "link") {
                    let nav = this.navLinks[paths[3]];
                    this.el_content.innerHTML = "";
                    this.com_nav_links.open(nav);
                }
                el = document.getElementById(paths[3]);
                if (el) {
                    el.scrollIntoView();
                }
                break;
        }
    }
    setAttackRunning(runRequest) {
        if (!runRequest) {
            this.el_attack_running.innerHTML = "-";
            return;
        }
        if (!runRequest.Target || !runRequest.HttpTarget) {
            this.el_attack_running.innerHTML = "-";
            return;
        }
        this.el_attack_running.innerHTML = `
			${runRequest.Target.Name} <br/>
			/ ${runRequest.HttpTarget.Name} <br/>
			<br/>
		`;
        this.el_attack_cancel.onclick = () => {
            this.onClickAttackCancel();
        };
        this.el_attack_running.appendChild(this.el_attack_cancel);
        wui_notif.Info(`Attacking "${runRequest.Target.Name}/${runRequest.HttpTarget.Name}" ...`);
    }
    AttackHttp(target, http_target) {
        return __awaiter(this, void 0, void 0, function* () {
            Save(target, http_target, null);
            let attackReq = {
                Target: {
                    ID: target.ID,
                    Opts: target.Opts,
                    Vars: target.Vars,
                    Name: target.Name,
                    BaseUrl: target.BaseUrl,
                    HttpTargets: [],
                    WebSocketTargets: [],
                },
                HttpTarget: {
                    ID: http_target.ID,
                    Name: http_target.Name,
                    Method: http_target.Method,
                    Path: http_target.Path,
                    RequestType: http_target.RequestType,
                    Headers: http_target.Headers,
                    Params: http_target.Params,
                    Results: [],
                    AllowAttack: http_target.AllowAttack,
                    IsCustomizable: http_target.IsCustomizable,
                },
                WebSocketTarget: null,
            };
            let http_res = yield fetch(API_ATTACK_HTTP, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(attackReq),
            });
            let json_res = yield http_res.json();
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
                return null;
            }
            this.setAttackRunning(attackReq);
            return json_res;
        });
    }
    AttackHttpDelete(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = `Are you sure you want to delete the result: ${name}?`;
            let yes = window.confirm(msg);
            if (!yes) {
                return null;
            }
            let url = API_ATTACK_RESULT + "?name=" + name;
            let fres = yield fetch(url, {
                method: "DELETE",
            });
            let json_res = yield fres.json();
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
                return null;
            }
            return json_res;
        });
    }
    AttackHttpGet(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = API_ATTACK_RESULT + "?name=" + name;
            let fres = yield fetch(url);
            let res = yield fres.json();
            if (res.code != 200) {
                wui_notif.Error(res.message);
            }
            return res;
        });
    }
    ContentRenderer(target, http_target, ws_target, nav_link, el) {
        let hash = "#/" + target.ID;
        if (http_target) {
            hash += "/http/" + http_target.ID;
        }
        else if (ws_target) {
            hash += "/ws/" + ws_target.ID;
        }
        else if (nav_link) {
            hash += "/link/" + nav_link.ID;
        }
        window.location.hash = hash;
        this.el_content.innerHTML = "";
        this.el_content.appendChild(el);
    }
    RunHttp(target, http_target) {
        return __awaiter(this, void 0, void 0, function* () {
            Save(target, http_target, null);
            let req = {
                Target: {
                    ID: target.ID,
                    Opts: target.Opts,
                    Vars: target.Vars,
                    Name: "",
                    BaseUrl: "",
                    HttpTargets: [],
                    WebSocketTargets: [],
                },
                HttpTarget: http_target,
                WebSocketTarget: null,
            };
            let http_res = yield fetch(API_TARGET_RUN_HTTP, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req),
            });
            let json_res = yield http_res.json();
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
                return null;
            }
            let res = json_res.data;
            if (res.ResponseStatusCode != 200) {
                wui_notif.Error(`${http_target.Name}: ${res.ResponseStatus}`);
            }
            else {
                wui_notif.Info(`${http_target.Name}: ${res.ResponseStatus}`);
            }
            return res;
        });
    }
    RunWebSocket(target, ws_target) {
        return __awaiter(this, void 0, void 0, function* () {
            Save(target, null, ws_target);
            let req = {
                Target: {
                    ID: target.ID,
                    Opts: target.Opts,
                    Vars: target.Vars,
                    Name: "",
                    BaseUrl: "",
                    HttpTargets: [],
                    WebSocketTargets: [],
                },
                HttpTarget: null,
                WebSocketTarget: ws_target,
            };
            let fres = yield fetch(API_TARGET_RUN_WEBSOCKET, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req),
            });
            let json_res = yield fres.json();
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
                return null;
            }
            wui_notif.Info(`${ws_target.Name}: success.`);
            return json_res;
        });
    }
    SetContent(path, el) {
        this.el_content.innerHTML = "";
        if (el) {
            this.el_content.appendChild(el);
        }
        window.location.hash = "#/" + path;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1bmtzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJ1bmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDREQUE0RDtBQUM1RCw0Q0FBNEM7Ozs7Ozs7Ozs7QUFFNUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQzlDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUNyQyxPQUFPLEVBR04sZ0JBQWdCLEdBWWhCLE1BQU0sZ0JBQWdCLENBQUE7QUFDdkIsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3pDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUVyQyxNQUFNLGVBQWUsR0FBRywwQkFBMEIsQ0FBQTtBQUNsRCxNQUFNLGlCQUFpQixHQUFHLDRCQUE0QixDQUFBO0FBQ3RELE1BQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFBO0FBQ2xELE1BQU0sWUFBWSxHQUFHLHVCQUF1QixDQUFBO0FBQzVDLE1BQU0sV0FBVyxHQUFHLHNCQUFzQixDQUFBO0FBRTFDLE1BQU0sbUJBQW1CLEdBQUcsOEJBQThCLENBQUE7QUFDMUQsTUFBTSx3QkFBd0IsR0FBRyxtQ0FBbUMsQ0FBQTtBQUVwRSxNQUFNLG9CQUFvQixHQUFHLHVCQUF1QixDQUFBO0FBQ3BELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQTtBQUNwQyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUE7QUFDaEMsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFBO0FBVTlCLE1BQU0sT0FBTyxNQUFNO0lBdUJsQjtRQWRBLFFBQUcsR0FBeUI7WUFDM0IsYUFBYSxFQUFFLEVBQUU7WUFDakIsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixhQUFhLEVBQUUsQ0FBQztZQUNoQixVQUFVLEVBQUUsRUFBRTtZQUNkLGFBQWEsRUFBRSxFQUFF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