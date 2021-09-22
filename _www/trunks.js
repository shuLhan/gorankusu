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
import { HASH_ENVIRONMENT, } from "./interface.js";
import { Target } from "./target.js";
import { wui_notif } from "./vars.js";
const API_ENVIRONMENT = "/_trunks/api/environment";
const API_TARGETS = "/_trunks/api/targets";
const API_TARGET_ATTACK = "/_trunks/api/target/attack";
const API_TARGET_ATTACK_RESULT = "/_trunks/api/target/attack/result";
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
        this.el = document.createElement("div");
        this.com_env = new Environment(this, this.env);
        this.generateNav();
        this.generateContent();
        document.body.appendChild(this.el);
    }
    generateNav() {
        let el_nav = document.createElement("div");
        el_nav.classList.add(CLASS_NAV);
        el_nav.appendChild(this.com_env.el_nav);
        this.el_nav_content = document.createElement("div");
        el_nav.appendChild(this.el_nav_content);
        let el_nav_footer = document.createElement("div");
        el_nav_footer.classList.add(CLASS_FOOTER);
        el_nav_footer.innerHTML = `
			Powered by
			<a href="https://sr.ht/~shulhan/trunks" target="_blank">
				Trunks
			</a>
		`;
        el_nav.appendChild(el_nav_footer);
        this.el.appendChild(el_nav);
    }
    generateContent() {
        let wrapper = document.createElement("div");
        wrapper.classList.add(CLASS_MAIN);
        this.el_attack_running = document.createElement("div");
        this.el_attack_running.classList.add(CLASS_ATTACK_RUNNING);
        wrapper.appendChild(this.el_attack_running);
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
            let http_res = yield fetch(API_TARGET_ATTACK, {
                method: "DELETE",
            });
            let res = yield http_res.json();
            if (res.code != 200) {
                wui_notif.Error(res.message);
                return;
            }
            this.setAttackRunning(null);
            wui_notif.Info(res.message);
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
        let el;
        let target = this.targets[paths[1]];
        switch (paths.length) {
            case 2:
            case 3:
                if (!target) {
                    return;
                }
                this.el_content.innerHTML = "";
                this.el_content.appendChild(target.el_content);
                el = document.getElementById(paths[1]);
                if (el) {
                    el.scrollIntoView();
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
                el = document.getElementById(paths[3]);
                if (el) {
                    el.scrollIntoView();
                }
                break;
        }
    }
    setAttackRunning(runRequest) {
        if (!runRequest) {
            this.el_attack_running.innerHTML = "Attack running: -";
            return;
        }
        if (!runRequest.Target || !runRequest.HttpTarget) {
            this.el_attack_running.innerHTML = "Attack running: -";
            return;
        }
        this.el_attack_running.innerHTML = `
			Attack running: ${runRequest.Target.Name} / ${runRequest.HttpTarget.Name}
			&nbsp;
		`;
        this.el_attack_cancel.onclick = () => {
            this.onClickAttackCancel();
        };
        this.el_attack_running.appendChild(this.el_attack_cancel);
    }
    AttackHttp(target, http_target) {
        return __awaiter(this, void 0, void 0, function* () {
            let req = {
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
            let http_res = yield fetch("/_trunks/api/target/attack", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req),
            });
            let json_res = yield http_res.json();
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
            }
            else {
                this.setAttackRunning(req);
            }
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
            let url = API_TARGET_ATTACK_RESULT + "?name=" + name;
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
            let url = API_TARGET_ATTACK_RESULT + "?name=" + name;
            let fres = yield fetch(url);
            let res = yield fres.json();
            if (res.code != 200) {
                wui_notif.Error(res.message);
            }
            return res;
        });
    }
    ContentRenderer(target, http_target, ws_target, el) {
        let hash = "#/" + target.ID;
        if (http_target) {
            hash += "/http/" + http_target.ID;
        }
        else if (ws_target) {
            hash += "/ws/" + ws_target.ID;
        }
        window.location.hash = hash;
        this.el_content.innerHTML = "";
        this.el_content.appendChild(el);
    }
    RunHttp(target, http_target) {
        return __awaiter(this, void 0, void 0, function* () {
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
        this.el_content.appendChild(el);
        window.location.hash = "#/" + path;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1bmtzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJ1bmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM5QyxPQUFPLEVBRU4sZ0JBQWdCLEdBVWhCLE1BQU0sZ0JBQWdCLENBQUE7QUFDdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBRXJDLE1BQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFBO0FBQ2xELE1BQU0sV0FBVyxHQUFHLHNCQUFzQixDQUFBO0FBQzFDLE1BQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUE7QUFDdEQsTUFBTSx3QkFBd0IsR0FBRyxtQ0FBbUMsQ0FBQTtBQUNwRSxNQUFNLG1CQUFtQixHQUFHLDhCQUE4QixDQUFBO0FBQzFELE1BQU0sd0JBQXdCLEdBQUcsbUNBQW1DLENBQUE7QUFFcEUsTUFBTSxvQkFBb0IsR0FBRyx1QkFBdUIsQ0FBQTtBQUNwRCxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUE7QUFDcEMsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFBO0FBQ2hDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQTtBQU05QixNQUFNLE9BQU8sTUFBTTtJQW1CbEI7UUFaQSxRQUFHLEdBQXlCO1lBQzNCLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsYUFBYSxFQUFFLENBQUM7WUFDaEIsVUFBVSxFQUFFLEVBQUU7WUFDZCxhQUFhLEVBQUUsRUFBRTtZQUNqQixhQUFhLEVBQUUsSUFBSTtTQUNuQixDQUFBO1FBR0QsWUFBTyxHQUFnQixFQUFFLENBQUE7UUFHeEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXZDLElBQUksQ0FBQyxPQUFPLEdB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