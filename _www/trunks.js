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
        this.navLinks = {};
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
        this.el_nav_links = document.createElement("div");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1bmtzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJ1bmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sRUFDTixrQkFBa0IsR0FJbEIsTUFBTSwyQkFBMkIsQ0FBQTtBQUVsQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDOUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3JDLE9BQU8sRUFHTixnQkFBZ0IsR0FZaEIsTUFBTSxnQkFBZ0IsQ0FBQTtBQUN2QixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBRXJDLE1BQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFBO0FBQ2xELE1BQU0saUJBQWlCLEdBQUcsNEJBQTRCLENBQUE7QUFDdEQsTUFBTSxlQUFlLEdBQUcsMEJBQTBCLENBQUE7QUFDbEQsTUFBTSxZQUFZLEdBQUcsdUJBQXVCLENBQUE7QUFDNUMsTUFBTSxXQUFXLEdBQUcsc0JBQXNCLENBQUE7QUFFMUMsTUFBTSxtQkFBbUIsR0FBRyw4QkFBOEIsQ0FBQTtBQUMxRCxNQUFNLHdCQUF3QixHQUFHLG1DQUFtQyxDQUFBO0FBRXBFLE1BQU0sb0JBQW9CLEdBQUcsdUJBQXVCLENBQUE7QUFDcEQsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFBO0FBQ3BDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQTtBQUNoQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUE7QUFFOUIsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUE7QUFVbkMsTUFBTSxPQUFPLE1BQU07SUEyQmxCO1FBbEJBLFFBQUcsR0FBeUI7WUFDM0IsYUFBYSxFQUFFLEVBQUU7WUFDakIsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLFVBQVUsRUFBRSxFQUFFO1lBQ2QsYUFBYSxFQUFFLEVBQUU7WUFDakIsYUFBYSxFQUFFLElBQUk7U0FDbkIsQ0FBQTtRQUdELFFBQUcsR0FBOEIsSUFBSSxDQUFBO1FBSXJDLFlBQU8sR0FBZ0IsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBaUIsRUFBRSxDQUFBO1FBRzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUV2QyxJQUFJLENBQUMsUUFBUSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEVBQUU7WUFDWCxRQUFRLEVBQUUsSUFBSTtZQUNkLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLHVCQUF1QixFQUFFLHNCQUFzQjtZQUMvQyxXQUFXLEVBQUUsQ0FBQyxHQUF5QixFQUFFLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDeEIsQ0FBQztZQUNELFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUNyQixDQUFDO1lBQ0QsY0FBYyxFQUFFLEdBQUcsRUFBRTtnQkFDcEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7WUFDeEIsQ0FBQztZQUNELE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2pCLENBQUM7U0FDRCxDQUFBO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzlDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNsQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7UUFFdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25DLENBQUM7SUFFTyxXQUFXO1FBQ2xCLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDMUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7UUFFL0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFdEQsSUFBSSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQzFELElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDN0MsTUFBTSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQTtRQUVuQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO1FBRTFELElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNuRCxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFakQsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNqRCxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUN6QyxhQUFhLENBQUMsU0FBUyxHQUFHOzs7OztHQUt6QixDQUFBO1FBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUUxQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDckMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1FBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUVyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUNqQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRU8sZUFBZTtRQUN0QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzNDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRWpDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFBO1FBRTFDLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUVwQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBRUssSUFBSTs7WUFDVCxNQUFNLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1lBQzlCLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBQ3hCLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1lBRXpCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1lBQ3pCLE1BQU0sQ0FBQyxZQUFZLEdBQUcsR0FBRyxFQUFFO2dCQUMxQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtZQUMxQixDQUFDLENBQUE7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU87Z0JBQ3BCLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUTtvQkFDeEIsR0FBRztvQkFDSCxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFBO1lBQzdCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDakQsQ0FBQztLQUFBO0lBRUssaUJBQWlCOztZQUN0QixJQUFJLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUMzQyxJQUFJLEdBQUcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUMvQixJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFO2dCQUNwQixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDNUIsT0FBTTthQUNOO1lBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO1lBRW5CLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUMzQixDQUFDO0tBQUE7SUFFSyxZQUFZOztZQUNqQixJQUFJLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUN4QyxJQUFJLEdBQUcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUMvQixJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFO2dCQUNwQixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDNUIsT0FBTTthQUNOO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2pELElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUE7WUFFeEQsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFO2dCQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUE7YUFDM0I7UUFDRixDQUFDO0tBQUE7SUFFSyxXQUFXOztZQUNoQixJQUFJLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUN2QyxJQUFJLEdBQUcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUMvQixJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFO2dCQUNwQixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDNUIsT0FBTTthQUNOO1lBRUQsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQTtZQUV0QixJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7WUFFbEMsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUU7Z0JBQzNCLElBQUksVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFBO2dCQUVwQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7YUFDbEQ7UUFDRixDQUFDO0tBQUE7SUFFYSxtQkFBbUI7O1lBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtnQkFDM0MsT0FBTTthQUNOO1lBRUQsSUFBSSxHQUFHLEdBQXdCO2dCQUM5QixFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDZCxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsTUFBTSxFQUFFLGVBQWU7YUFDdkIsQ0FBQTtZQUVELElBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDdkMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtnQkFDekIsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ2pDLE9BQU07YUFDTjtZQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUUzQixTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNqQyxDQUFDO0tBQUE7SUFFTyxrQkFBa0I7UUFDekIsMkJBQTJCO1FBQzNCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM1QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzNCLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckIsT0FBTTtTQUNOO1FBRUQsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssZ0JBQWdCLEVBQUU7WUFDbEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO1lBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDcEQsT0FBTTtTQUNOO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFN0IsSUFBSSxFQUFzQixDQUFBO1FBQzFCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbkMsUUFBUSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ3JCLEtBQUssQ0FBQyxDQUFDO1lBQ1AsS0FBSyxDQUFDO2dCQUNMLElBQUksTUFBTSxFQUFFO29CQUNYLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtvQkFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQzFCLE1BQU0sQ0FBQyxVQUFVLENBQ2pCLENBQUE7b0JBQ0QsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQ3RDLElBQUksRUFBRSxFQUFFO3dCQUNQLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtxQkFDbkI7aUJBQ0Q7Z0JBQ0QsTUFBSztZQUVOLEtBQUssQ0FBQztnQkFDTCxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxNQUFNLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtvQkFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQzFCLE1BQU0sQ0FBQyxVQUFVLENBQ2pCLENBQUE7aUJBQ0Q7cUJBQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO29CQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7b0JBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUMxQixNQUFNLENBQUMsVUFBVSxDQUNqQixDQUFBO2lCQUNEO3FCQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sRUFBRTtvQkFDL0IsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDakMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO29CQUM5QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtpQkFDNUI7Z0JBQ0QsRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ3RDLElBQUksRUFBRSxFQUFFO29CQUNQLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtpQkFDbkI7Z0JBQ0QsTUFBSztTQUNOO0lBQ0YsQ0FBQztJQUVPLGFBQWEsQ0FBQyxHQUF5QjtRQUM5QyxRQUFRLEdBQUcsQ0FBQyxPQUFPLEVBQUU7WUFDcEIsS0FBSyxpQkFBaUI7Z0JBQ3JCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQ0UsQ0FBQTtnQkFFakIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUUzQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQTtnQkFDN0MsSUFBSSxhQUFhLEdBQ2hCLFNBQVMsQ0FBQyxZQUFZLENBQ3JCLE1BQU0sQ0FBQyxZQUFZLENBQ25CLENBQUE7Z0JBRUYsYUFBYSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFFckMsU0FBUyxDQUFDLElBQUksQ0FDYix1QkFBdUIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FDekUsQ0FBQTtTQUNGO0lBQ0YsQ0FBQztJQUVPLGFBQWE7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQTtJQUN2RCxDQUFDO0lBQ08sZ0JBQWdCO1FBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEdBQUcsc0JBQXNCLENBQUE7SUFDMUQsQ0FBQztJQUNPLFNBQVM7UUFDaEIsT0FBTztJQUNSLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxVQUFzQztRQUN0RCxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFBO1lBQ3RDLE9BQU07U0FDTjtRQUNELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRTtZQUNqRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQTtZQUN0QyxPQUFNO1NBQ047UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxHQUFHO0tBQ2hDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSTtPQUNwQixVQUFVLENBQUMsVUFBVSxDQUFDLElBQUk7O0dBRTlCLENBQUE7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtZQUNwQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtRQUMzQixDQUFDLENBQUE7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBRXpELFNBQVMsQ0FBQyxJQUFJLENBQ2IsY0FBYyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUN6RSxDQUFBO0lBQ0YsQ0FBQztJQUVLLFVBQVUsQ0FDZixNQUF1QixFQUN2QixXQUFnQzs7WUFFaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFBO2dCQUMzQyxPQUFPLElBQUksQ0FBQTthQUNYO1lBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFFL0IsSUFBSSxTQUFTLEdBQXdCO2dCQUNwQyxNQUFNLEVBQUU7b0JBQ1AsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO29CQUNiLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDakIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO29CQUNqQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7b0JBQ2pCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztvQkFDdkIsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsZ0JBQWdCLEVBQUUsRUFBRTtpQkFDcEI7Z0JBQ0QsVUFBVSxFQUFFO29CQUNYLEVBQUUsRUFBRSxXQUFXLENBQUMsRUFBRTtvQkFDbEIsSUFBSSxFQUFFLFdBQVcsQ0FBQyxJQUFJO29CQUN0QixNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07b0JBQzFCLElBQUksRUFBRSxXQUFXLENBQUMsSUFBSTtvQkFDdEIsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO29CQUNwQyxPQUFPLEVBQUUsV0FBVyxDQUFDLE9BQU87b0JBQzVCLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtvQkFDMUIsT0FBTyxFQUFFLEVBQUU7b0JBQ1gsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO29CQUNwQyxjQUFjLEVBQUUsV0FBVyxDQUFDLGNBQWM7aUJBQzFDO2dCQUNELGVBQWUsRUFBRSxJQUFJO2FBQ3JCLENBQUE7WUFFRCxJQUFJLEdBQUcsR0FBd0I7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNkLE1BQU0sRUFBRSxNQUFNO2dCQUNkLE1BQU0sRUFBRSxlQUFlO2dCQUN2QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDckMsQ0FBQTtZQUVELElBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDdkMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtnQkFDekIsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFBO2FBQ1g7WUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFaEMsT0FBTyxRQUFRLENBQUE7UUFDaEIsQ0FBQztLQUFBO0lBRUssZ0JBQWdCLENBQ3JCLElBQVk7O1lBRVosSUFBSSxHQUFHLEdBQUcsK0NBQStDLElBQUksR0FBRyxDQUFBO1lBQ2hFLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDN0IsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxPQUFPLElBQUksQ0FBQTthQUNYO1lBRUQsSUFBSSxHQUFHLEdBQUcsaUJBQWlCLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQTtZQUM3QyxJQUFJLElBQUksR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQzNCLE1BQU0sRUFBRSxRQUFRO2FBQ2hCLENBQUMsQ0FBQTtZQUNGLElBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1lBQ2hDLElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7Z0JBQ3pCLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUNqQyxPQUFPLElBQUksQ0FBQTthQUNYO1lBQ0QsT0FBTyxRQUFRLENBQUE7UUFDaEIsQ0FBQztLQUFBO0lBRUssYUFBYSxDQUFDLElBQVk7O1lBQy9CLElBQUksR0FBRyxHQUFHLGlCQUFpQixHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUE7WUFDN0MsSUFBSSxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDM0IsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDM0IsSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtnQkFDcEIsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7YUFDNUI7WUFDRCxPQUFPLEdBQUcsQ0FBQTtRQUNYLENBQUM7S0FBQTtJQUVELGVBQWUsQ0FDZCxNQUF1QixFQUN2QixXQUFnQyxFQUNoQyxTQUFtQyxFQUNuQyxRQUEwQixFQUMxQixFQUFlO1FBRWYsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUE7UUFDM0IsSUFBSSxXQUFXLEVBQUU7WUFDaEIsSUFBSSxJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFBO1NBQ2pDO2FBQU0sSUFBSSxTQUFTLEVBQUU7WUFDckIsSUFBSSxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFBO1NBQzdCO2FBQU0sSUFBSSxRQUFRLEVBQUU7WUFDcEIsSUFBSSxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFBO1NBQzlCO1FBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBRTNCLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtRQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNoQyxDQUFDO0lBRUssT0FBTyxDQUNaLE1BQXVCLEVBQ3ZCLFdBQWdDOztZQUVoQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUUvQixJQUFJLEdBQUcsR0FBd0I7Z0JBQzlCLE1BQU0sRUFBRTtvQkFDUCxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7b0JBQ2IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO29CQUNqQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7b0JBQ2pCLElBQUksRUFBRSxFQUFFO29CQUNSLE9BQU8sRUFBRSxFQUFFO29CQUNYLFdBQVcsRUFBRSxFQUFFO29CQUNmLGdCQUFnQixFQUFFLEVBQUU7aUJBQ3BCO2dCQUNELFVBQVUsRUFBRSxXQUFXO2dCQUN2QixlQUFlLEVBQUUsSUFBSTthQUNyQixDQUFBO1lBRUQsSUFBSSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsbUJBQW1CLEVBQUU7Z0JBQy9DLE1BQU0sRUFBRSxNQUFNO2dCQUNkLE9BQU8sRUFBRTtvQkFDUixjQUFjLEVBQUUsa0JBQWtCO2lCQUNsQztnQkFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDekIsQ0FBQyxDQUFBO1lBRUYsSUFBSSxRQUFRLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDcEMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtnQkFDekIsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFBO2FBQ1g7WUFFRCxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBNEIsQ0FBQTtZQUUvQyxJQUFJLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxHQUFHLEVBQUU7Z0JBQ2xDLFNBQVMsQ0FBQyxLQUFLLENBQ2QsR0FBRyxXQUFXLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FDNUMsQ0FBQTthQUNEO2lCQUFNO2dCQUNOLFNBQVMsQ0FBQyxJQUFJLENBQ2IsR0FBRyxXQUFXLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FDNUMsQ0FBQTthQUNEO1lBRUQsT0FBTyxHQUFHLENBQUE7UUFDWCxDQUFDO0tBQUE7SUFFSyxZQUFZLENBQ2pCLE1BQXVCLEVBQ3ZCLFNBQW1DOztZQUVuQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtZQUU3QixJQUFJLEdBQUcsR0FBd0I7Z0JBQzlCLE1BQU0sRUFBRTtvQkFDUCxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7b0JBQ2IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO29CQUNqQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7b0JBQ2pCLElBQUksRUFBRSxFQUFFO29CQUNSLE9BQU8sRUFBRSxFQUFFO29CQUNYLFdBQVcsRUFBRSxFQUFFO29CQUNmLGdCQUFnQixFQUFFLEVBQUU7aUJBQ3BCO2dCQUNELFVBQVUsRUFBRSxJQUFJO2dCQUNoQixlQUFlLEVBQUUsU0FBUzthQUMxQixDQUFBO1lBRUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUMsd0JBQXdCLEVBQUU7Z0JBQ2hELE1BQU0sRUFBRSxNQUFNO2dCQUNkLE9BQU8sRUFBRTtvQkFDUixjQUFjLEVBQUUsa0JBQWtCO2lCQUNsQztnQkFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDekIsQ0FBQyxDQUFBO1lBRUYsSUFBSSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDaEMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtnQkFDekIsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFBO2FBQ1g7WUFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksWUFBWSxDQUFDLENBQUE7WUFDN0MsT0FBTyxRQUFRLENBQUE7UUFDaEIsQ0FBQztLQUFBO0lBRUQsVUFBVSxDQUFDLElBQVksRUFBRSxFQUFzQjtRQUM5QyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFFOUIsSUFBSSxFQUFFLEVBQUU7WUFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtTQUMvQjtRQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUE7SUFDbkMsQ0FBQztDQUNEIn0=