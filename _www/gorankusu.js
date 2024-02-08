// SPDX-FileCopyrightText: 2021 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later
import { Environment } from "./environment.js";
import { save } from "./functions.js";
import { HASH_ENVIRONMENT, } from "./interface.js";
import { NavLinks } from "./nav_links.js";
import { Target } from "./target.js";
import { wuiNotif } from "./vars.js";
const API_ATTACK_HTTP = "/_gorankusu/api/attack/http";
const API_ATTACK_RESULT = "/_gorankusu/api/attack/result";
const API_ENVIRONMENT = "/_gorankusu/api/environment";
const API_NAVLINKS = "/_gorankusu/api/navlinks";
const API_TARGETS = "/_gorankusu/api/targets";
const API_TARGET_RUN_HTTP = "/_gorankusu/api/target/run/http";
const API_TARGET_RUN_WEBSOCKET = "/_gorankusu/api/target/run/websocket";
const CLASS_ATTACK_RUNNING = "gorankusu_attack_running";
const CLASS_FOOTER = "gorankusu_footer";
const CLASS_MAIN = "gorankusu_main";
const CLASS_NAV = "gorankusu_nav";
export class Gorankusu {
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
        this.comEnv = new Environment(this, this.env);
        this.generateNav();
        this.generateContent();
        document.body.appendChild(this.el);
    }
    generateNav() {
        const elNav = document.createElement("div");
        elNav.classList.add(CLASS_NAV);
        this.elWSConnStatus = document.createElement("div");
        const fsAttackRunning = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.innerText = "Attack running";
        this.elAttackRunning = document.createElement("span");
        this.elAttackRunning.classList.add(CLASS_ATTACK_RUNNING);
        this.elNavContent = document.createElement("div");
        this.elNavLinks = document.createElement("div");
        const elNavFooter = document.createElement("div");
        elNavFooter.classList.add(CLASS_FOOTER);
        elNavFooter.innerHTML = `
			<div>
				<div>Powered by <a href="https://sr.ht/~shulhan/gorankusu" target="_blank">Gorankusu</a></div>
				<div><a href="/doc/" target="_blank">Documentation</a></div>
			</div>
		`;
        elNav.appendChild(this.elWSConnStatus);
        fsAttackRunning.appendChild(legend);
        fsAttackRunning.appendChild(this.elAttackRunning);
        elNav.appendChild(fsAttackRunning);
        elNav.appendChild(this.comEnv.elNav);
        elNav.appendChild(this.elNavContent);
        elNav.appendChild(document.createElement("hr"));
        elNav.appendChild(this.elNavLinks);
        elNav.appendChild(elNavFooter);
        this.el.appendChild(elNav);
    }
    generateContent() {
        const wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_MAIN);
        this.elAttackCancel = document.createElement("button");
        this.elAttackCancel.innerHTML = "Cancel";
        this.elContent = document.createElement("div");
        wrapper.appendChild(this.elContent);
        this.el.appendChild(wrapper);
    }
    async init() {
        await this.apiEnvironmentGet();
        await this.initTargets();
        await this.initNavLinks();
        this.windowOnHashChange();
        window.onhashchange = () => {
            this.windowOnHashChange();
        };
    }
    async apiEnvironmentGet() {
        const httpRes = await fetch(API_ENVIRONMENT);
        const res = await httpRes.json();
        if (res.code != 200) {
            wuiNotif.error(res.message);
            return;
        }
        this.env = res.data;
        this.setAttackRunning(this.env.AttackRunning);
        this.comEnv.set(this.env);
    }
    async initNavLinks() {
        const httpRes = await fetch(API_NAVLINKS);
        const res = await httpRes.json();
        if (res.code != 200) {
            wuiNotif.error(res.message);
            return;
        }
        this.comNavLinks = new NavLinks(this, res.data);
        this.elNavLinks.appendChild(this.comNavLinks.elNav);
        for (const nav of res.data) {
            this.navLinks[nav.ID] = nav;
        }
    }
    async initTargets() {
        const httpRes = await fetch(API_TARGETS);
        const res = await httpRes.json();
        if (res.code != 200) {
            wuiNotif.error(res.message);
            return;
        }
        const targets = res.data;
        this.elNavContent.innerHTML = "";
        for (const target of targets) {
            const comTarget = new Target(this, target);
            this.targets[target.ID] = comTarget;
            this.elNavContent.appendChild(comTarget.elNav);
        }
    }
    async onClickAttackCancel() {
        const fres = await fetch(API_ATTACK_HTTP, {
            method: "DELETE",
        });
        const jsonRes = await fres.json();
        if (jsonRes.code != 200) {
            wuiNotif.error(jsonRes.message);
            return null;
        }
        wuiNotif.info(jsonRes.message);
        this.setAttackRunning(null);
        return jsonRes;
    }
    windowOnHashChange() {
        // Parse the location hash.
        const path = window.location.hash.substring(1);
        const paths = path.split("/");
        if (paths.length < 2) {
            return;
        }
        if (paths[1] === HASH_ENVIRONMENT) {
            this.elContent.innerHTML = "";
            this.elContent.appendChild(this.comEnv.elContent);
            return;
        }
        console.log("paths: ", paths);
        let el;
        if (!paths[1]) {
            return;
        }
        const target = this.targets[paths[1]];
        if (!target) {
            return;
        }
        switch (paths.length) {
            case 2:
            case 3:
                if (target) {
                    this.elContent.innerHTML = "";
                    this.elContent.appendChild(target.elContent);
                    el = document.getElementById(paths[1]);
                    if (el) {
                        el.scrollIntoView();
                    }
                }
                break;
            case 4:
                if (paths[2] === "http") {
                    this.elContent.innerHTML = "";
                    this.elContent.appendChild(target.elContent);
                }
                else if (paths[2] === "ws") {
                    this.elContent.innerHTML = "";
                    this.elContent.appendChild(target.elContent);
                }
                else if (paths[2] === "link") {
                    if (paths[3]) {
                        const nav = this.navLinks[paths[3]];
                        if (nav) {
                            this.elContent.innerHTML = "";
                            this.comNavLinks.open(nav);
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
            this.elAttackRunning.innerHTML = "-";
            return;
        }
        if (!runRequest.Target || !runRequest.HTTPTarget) {
            this.elAttackRunning.innerHTML = "-";
            return;
        }
        this.elAttackRunning.innerHTML = `
			${runRequest.Target.Name} <br/>
			/ ${runRequest.HTTPTarget.Name} <br/>
			<br/>
		`;
        this.elAttackCancel.onclick = () => {
            this.onClickAttackCancel();
        };
        this.elAttackRunning.appendChild(this.elAttackCancel);
        wuiNotif.info(`Attacking "${runRequest.Target.Name}/${runRequest.HTTPTarget.Name}" ...`);
    }
    async attackHTTP(target, httpTarget) {
        save(target, httpTarget, null);
        const attackReq = {
            Target: {
                ID: target.ID,
                Opts: target.Opts,
                Vars: target.Vars,
                Name: target.Name,
                BaseURL: target.BaseURL,
                HTTPTargets: [],
                WebSocketTargets: [],
            },
            HTTPTarget: {
                ID: httpTarget.ID,
                Name: httpTarget.Name,
                Method: httpTarget.Method,
                Path: httpTarget.Path,
                RequestType: httpTarget.RequestType,
                Headers: httpTarget.Headers,
                Params: httpTarget.Params,
                RawBody: httpTarget.RawBody,
                Results: [],
                AllowAttack: httpTarget.AllowAttack,
                IsCustomizable: httpTarget.IsCustomizable,
                WithRawBody: httpTarget.WithRawBody,
            },
            WebSocketTarget: null,
        };
        const httpRes = await fetch(API_ATTACK_HTTP, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(attackReq),
        });
        const jsonRes = await httpRes.json();
        if (jsonRes.code >= 400) {
            wuiNotif.error(jsonRes.message);
            return null;
        }
        this.setAttackRunning(attackReq);
        return jsonRes;
    }
    async attackHTTPDelete(name) {
        const msg = `Are you sure you want to delete the result: ${name}?`;
        const yes = window.confirm(msg);
        if (!yes) {
            return null;
        }
        const url = API_ATTACK_RESULT + "?name=" + name;
        const fres = await fetch(url, {
            method: "DELETE",
        });
        const jsonRes = await fres.json();
        if (jsonRes.code >= 400) {
            wuiNotif.error(jsonRes.message);
            return null;
        }
        return jsonRes;
    }
    async attackHTTPGet(name) {
        const url = API_ATTACK_RESULT + "?name=" + name;
        const fres = await fetch(url);
        const res = await fres.json();
        if (res.code >= 400) {
            wuiNotif.error(res.message);
        }
        return res;
    }
    contentRenderer(target, httpTarget, wsTarget, navLink, el) {
        let hash = "#/" + target.ID;
        if (httpTarget) {
            hash += "/http/" + httpTarget.ID;
        }
        else if (wsTarget) {
            hash += "/ws/" + wsTarget.ID;
        }
        else if (navLink) {
            hash += "/link/" + navLink.ID;
        }
        window.location.hash = hash;
        this.elContent.innerHTML = "";
        this.elContent.appendChild(el);
    }
    async runHTTP(target, httpTarget) {
        save(target, httpTarget, null);
        const req = {
            Target: {
                ID: target.ID,
                Opts: target.Opts,
                Vars: target.Vars,
                Name: "",
                BaseURL: "",
                HTTPTargets: [],
                WebSocketTargets: [],
            },
            HTTPTarget: httpTarget,
            WebSocketTarget: null,
        };
        const httpRes = await fetch(API_TARGET_RUN_HTTP, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        const jsonRes = await httpRes.json();
        if (jsonRes.code >= 400) {
            wuiNotif.error(jsonRes.message);
            return null;
        }
        const res = jsonRes.data;
        if (res.ResponseStatusCode >= 400) {
            wuiNotif.error(`${httpTarget.Name}: ${res.ResponseStatus}`);
        }
        else {
            wuiNotif.info(`${httpTarget.Name}: ${res.ResponseStatus}`);
        }
        return res;
    }
    async runWebSocket(target, wsTarget) {
        save(target, null, wsTarget);
        const req = {
            Target: {
                ID: target.ID,
                Opts: target.Opts,
                Vars: target.Vars,
                Name: "",
                BaseURL: "",
                HTTPTargets: [],
                WebSocketTargets: [],
            },
            HTTPTarget: null,
            WebSocketTarget: wsTarget,
        };
        const fres = await fetch(API_TARGET_RUN_WEBSOCKET, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
        });
        const jsonRes = await fres.json();
        if (jsonRes.code >= 400) {
            wuiNotif.error(jsonRes.message);
            return null;
        }
        wuiNotif.info(`${wsTarget.Name}: success.`);
        return jsonRes;
    }
    setContent(path, el) {
        this.elContent.innerHTML = "";
        if (el) {
            this.elContent.appendChild(el);
        }
        window.location.hash = "#/" + path;
    }
}
