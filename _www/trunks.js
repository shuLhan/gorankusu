// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
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
    async Init() {
        await this.apiEnvironmentGet();
        await this.initTargets();
        await this.initNavLinks();
        this.windowOnHashChange();
        window.onhashchange = () => {
            this.windowOnHashChange();
        };
    }
    async apiEnvironmentGet() {
        let http_res = await fetch(API_ENVIRONMENT);
        let res = await http_res.json();
        if (res.code != 200) {
            wui_notif.error(res.message);
            return;
        }
        this.env = res.data;
        this.setAttackRunning(this.env.AttackRunning);
        this.com_env.Set(this.env);
    }
    async initNavLinks() {
        let http_res = await fetch(API_NAVLINKS);
        let res = await http_res.json();
        if (res.code != 200) {
            wui_notif.error(res.message);
            return;
        }
        this.com_nav_links = new NavLinks(this, res.data);
        this.el_nav_links.appendChild(this.com_nav_links.el_nav);
        for (let nav of res.data) {
            this.navLinks[nav.ID] = nav;
        }
    }
    async initTargets() {
        let http_res = await fetch(API_TARGETS);
        let res = await http_res.json();
        if (res.code != 200) {
            wui_notif.error(res.message);
            return;
        }
        let targets = res.data;
        this.el_nav_content.innerHTML = "";
        for (let target of targets) {
            let com_target = new Target(this, target);
            this.targets[target.ID] = com_target;
            this.el_nav_content.appendChild(com_target.el_nav);
        }
    }
    async onClickAttackCancel() {
        let fres = await fetch(API_ATTACK_HTTP, {
            method: "DELETE",
        });
        let json_res = await fres.json();
        if (json_res.code != 200) {
            wui_notif.error(json_res.message);
            return null;
        }
        wui_notif.info(json_res.message);
        this.setAttackRunning(null);
        return json_res;
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
        if (!paths[1]) {
            return;
        }
        let target = this.targets[paths[1]];
        if (!target) {
            return;
        }
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
                    if (paths[3]) {
                        let nav = this.navLinks[paths[3]];
                        if (nav) {
                            this.el_content.innerHTML = "";
                            this.com_nav_links.open(nav);
                        }
                    }
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
        wui_notif.info(`Attacking "${runRequest.Target.Name}/${runRequest.HttpTarget.Name}" ...`);
    }
    async AttackHttp(target, http_target) {
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
        let http_res = await fetch(API_ATTACK_HTTP, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(attackReq),
        });
        let json_res = await http_res.json();
        if (json_res.code != 200) {
            wui_notif.error(json_res.message);
            return null;
        }
        this.setAttackRunning(attackReq);
        return json_res;
    }
    async AttackHttpDelete(name) {
        let msg = `Are you sure you want to delete the result: ${name}?`;
        let yes = window.confirm(msg);
        if (!yes) {
            return null;
        }
        let url = API_ATTACK_RESULT + "?name=" + name;
        let fres = await fetch(url, {
            method: "DELETE",
        });
        let json_res = await fres.json();
        if (json_res.code != 200) {
            wui_notif.error(json_res.message);
            return null;
        }
        return json_res;
    }
    async AttackHttpGet(name) {
        let url = API_ATTACK_RESULT + "?name=" + name;
        let fres = await fetch(url);
        let res = await fres.json();
        if (res.code != 200) {
            wui_notif.error(res.message);
        }
        return res;
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
    async RunHttp(target, http_target) {
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
        let http_res = await fetch(API_TARGET_RUN_HTTP, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        let json_res = await http_res.json();
        if (json_res.code != 200) {
            wui_notif.error(json_res.message);
            return null;
        }
        let res = json_res.data;
        if (res.ResponseStatusCode != 200) {
            wui_notif.error(`${http_target.Name}: ${res.ResponseStatus}`);
        }
        else {
            wui_notif.info(`${http_target.Name}: ${res.ResponseStatus}`);
        }
        return res;
    }
    async RunWebSocket(target, ws_target) {
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
        let fres = await fetch(API_TARGET_RUN_WEBSOCKET, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        let json_res = await fres.json();
        if (json_res.code != 200) {
            wui_notif.error(json_res.message);
            return null;
        }
        wui_notif.info(`${ws_target.Name}: success.`);
        return json_res;
    }
    SetContent(path, el) {
        this.el_content.innerHTML = "";
        if (el) {
            this.el_content.appendChild(el);
        }
        window.location.hash = "#/" + path;
    }
}
