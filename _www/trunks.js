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
        this.el_content.appendChild(el);
        window.location.hash = "#/" + path;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1bmtzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJ1bmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFDckMsT0FBTyxFQUVOLGdCQUFnQixHQVVoQixNQUFNLGdCQUFnQixDQUFBO0FBQ3ZCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUVyQyxNQUFNLGVBQWUsR0FBRywwQkFBMEIsQ0FBQTtBQUNsRCxNQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQTtBQUMxQyxNQUFNLGlCQUFpQixHQUFHLDRCQUE0QixDQUFBO0FBQ3RELE1BQU0sd0JBQXdCLEdBQUcsbUNBQW1DLENBQUE7QUFDcEUsTUFBTSxtQkFBbUIsR0FBRyw4QkFBOEIsQ0FBQTtBQUMxRCxNQUFNLHdCQUF3QixHQUFHLG1DQUFtQyxDQUFBO0FBRXBFLE1BQU0sb0JBQW9CLEdBQUcsdUJBQXVCLENBQUE7QUFDcEQsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFBO0FBQ3BDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQTtBQUNoQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUE7QUFNOUIsTUFBTSxPQUFPLE1BQU07SUFtQmxCO1FBWkEsUUFBRyxHQUF5QjtZQUMzQixhQUFhLEVBQUUsRUFBRTtZQUNqQixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLFVBQVUsRUFBRSxFQUFFO1lBQ2QsYUFBYSxFQUFFLEVBQUU7WUFDakIsYUFBYSxFQUFFLElBQUk7U0FDbkIsQ0FBQTtRQUdELFlBQU8sR0FBZ0IsRUFBRSxDQUFBO1FBR3hCLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEs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