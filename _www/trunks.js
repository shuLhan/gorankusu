var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { WuiWebSocketClient, } from "./wui/websocket_client.js";
import { Environment } from "./environment.js";
import { Save } from "./functions.js";
import { HASH_ENVIRONMENT, } from "./interface.js";
import { Target } from "./target.js";
import { wui_notif } from "./vars.js";
const API_ATTACK_HTTP = "/_trunks/api/attack/http";
const API_ATTACK_RESULT = "/_trunks/api/attack/result";
const API_ENVIRONMENT = "/_trunks/api/environment";
const API_TARGETS = "/_trunks/api/targets";
const API_TARGET_RUN_HTTP = "/_trunks/api/target/run/http";
const API_TARGET_RUN_WEBSOCKET = "/_trunks/api/target/run/websocket";
const CLASS_ATTACK_RUNNING = "trunks_attack_running";
const CLASS_FOOTER = "trunks_footer";
const CLASS_MAIN = "trunks_main";
const CLASS_NAV = "trunks_nav";
const WSC_RECONNECT_INTERVAL = 5000;
export class Trunks {
    constructor() {
        this.env = {
            ListenAddress: "",
            WebSocketListenPort: 8218,
            MaxAttackDuration: 0,
            MaxAttackRate: 0,
            ResultsDir: "",
            ResultsSuffix: "",
            AttackRunning: null,
        };
        this.wsc = null;
        this.targets = {};
        this.el = document.createElement("div");
        this.wsc_opts = {
            address: "",
            insecure: true,
            auto_reconnect: true,
            auto_reconnect_interval: WSC_RECONNECT_INTERVAL,
            onBroadcast: (res) => {
                this.wsOnBroadcast(res);
            },
            onConnected: () => {
                this.wsOnConnected();
            },
            onDisconnected: () => {
                this.wsOnDisconnected();
            },
            onError: () => {
                this.wsOnError();
            },
        };
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
        let el_nav_footer = document.createElement("div");
        el_nav_footer.classList.add(CLASS_FOOTER);
        el_nav_footer.innerHTML = `
			<div>
				Powered by
				<a href="https://sr.ht/~shulhan/trunks" target="_blank">Trunks</a>
			</div>
		`;
        el_nav.appendChild(this.el_ws_conn_status);
        fs_attack_running.appendChild(legend);
        fs_attack_running.appendChild(this.el_attack_running);
        el_nav.appendChild(fs_attack_running);
        el_nav.appendChild(this.com_env.el_nav);
        el_nav.appendChild(this.el_nav_content);
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
            this.windowOnHashChange();
            window.onhashchange = () => {
                this.windowOnHashChange();
            };
            this.wsc_opts.address =
                window.location.hostname +
                    ":" +
                    this.env.WebSocketListenPort;
            this.wsc = new WuiWebSocketClient(this.wsc_opts);
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
            if (!this.wsc) {
                console.error("websocket is not connected");
                return;
            }
            let req = {
                id: Date.now(),
                method: "DELETE",
                target: API_ATTACK_HTTP,
            };
            let json_res = yield this.wsc.Send(req);
            if (json_res.code != 200) {
                wui_notif.Error(json_res.message);
                return;
            }
            this.setAttackRunning(null);
            wui_notif.Info(json_res.message);
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
    wsOnBroadcast(res) {
        switch (res.message) {
            case API_ATTACK_RESULT:
                let result = JSON.parse(atob(res.body));
                this.setAttackRunning(null);
                let comTarget = this.targets[result.TargetID];
                let comHttpTarget = comTarget.http_targets[result.HttpTargetID];
                comHttpTarget.AddAttackResult(result);
                wui_notif.Info(`Attack finished on "${comTarget.opts.Name}/${comHttpTarget.opts.Name}".`);
        }
    }
    wsOnConnected() {
        this.el_ws_conn_status.innerHTML = "&#9670; Connected";
    }
    wsOnDisconnected() {
        this.el_ws_conn_status.innerHTML = "&#9671; Disconnected";
    }
    wsOnError() {
        // TODO
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
            if (!this.wsc) {
                console.error("websocket is not connected");
                return null;
            }
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
            let req = {
                id: Date.now(),
                method: "POST",
                target: API_ATTACK_HTTP,
                body: btoa(JSON.stringify(attackReq)),
            };
            let json_res = yield this.wsc.Send(req);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1bmtzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJ1bmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sRUFDTixrQkFBa0IsR0FJbEIsTUFBTSwyQkFBMkIsQ0FBQTtBQUVsQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDOUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3JDLE9BQU8sRUFFTixnQkFBZ0IsR0FXaEIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUN2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ3BDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFFckMsTUFBTSxlQUFlLEdBQUcsMEJBQTBCLENBQUE7QUFDbEQsTUFBTSxpQkFBaUIsR0FBRyw0QkFBNEIsQ0FBQTtBQUN0RCxNQUFNLGVBQWUsR0FBRywwQkFBMEIsQ0FBQTtBQUNsRCxNQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQTtBQUUxQyxNQUFNLG1CQUFtQixHQUFHLDhCQUE4QixDQUFBO0FBQzFELE1BQU0sd0JBQXdCLEdBQUcsbUNBQW1DLENBQUE7QUFFcEUsTUFBTSxvQkFBb0IsR0FBRyx1QkFBdUIsQ0FBQTtBQUNwRCxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUE7QUFDcEMsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFBO0FBQ2hDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQTtBQUU5QixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQTtBQU1uQyxNQUFNLE9BQU8sTUFBTTtJQXdCbEI7UUFoQkEsUUFBRyxHQUF5QjtZQUMzQixhQUFhLEVBQUUsRUFBRTtZQUNqQixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsYUFBYSxFQUFFLENBQUM7WUFDaEIsVUFBVSxFQUFFLEVBQUU7WUFDZCxhQUFhLEVBQUUsRUFB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