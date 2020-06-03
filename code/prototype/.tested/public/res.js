"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.res = void 0;
var rxjs_1 = require("rxjs");
var res = (function () {
    function res() {
        this.subjApp = new rxjs_1.Subject();
        this.subjUI = new rxjs_1.Subject();
        this.bloques = new Set();
        var bloques = this.bloques;
        this.num = 0;
        var vres = this;
        this.socket = new WebSocket('ws://localhost:8081/');
        this.socket.onopen = function () {
            var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0 });
            sockhttp: vres.subjUI.next({ type: "log", contenu: "Connexion établie" });
        };
        this.socket.onerror = function (event) {
            vres.subjApp.error(event);
        };
        this.socket.onmessage = function (event) {
            var data = JSON.parse(event.data);
            if ((vres.num === 0) || (data.numEnvoi !== vres.num && (data.numDest === vres.num || data.numDest === 0))) {
                if (!bloques.has(data.numEnvoi)) {
                    vres.subjApp.next({ type: "message", contenu: data });
                }
                else {
                    vres.subjUI.next({ type: "log", contenu: "Message bloqué (collaborateur " + data.numEnvoi + ")" });
                }
            }
        };
        this.socket.onclose = function () {
            vres.socket.close();
            vres.subjApp.next({ type: "stop", contenu: undefined });
            vres.subjUI.next({ type: "stop", contenu: undefined });
        };
    }
    res.prototype.getObsApp = function () {
        return this.subjApp.asObservable();
    };
    res.prototype.getObsUI = function () {
        return this.subjUI.asObservable();
    };
    res.prototype.setObsIn = function (obs) {
        var _this = this;
        obs.subscribe(function (data) {
            _this.dispatcher(data);
        });
    };
    res.prototype.dispatcher = function (data) {
        if (data.type === "message") {
            this.socket.send(data.contenu);
        }
        else if (data.type === "bloquage") {
            this.gererBlocage(data.contenu);
        }
        else if (data.type === "numUpdate") {
            this.num = data.contenu;
        }
        else if (data.type === "stop") {
            this.socket.close();
            this.subjApp.next({ type: "stop", contenu: undefined });
        }
        else {
            this.subjUI.next({ type: "log", contenu: "ERREUR: type inconnu dans le dispatcher res: " + data.type });
        }
    };
    res.prototype.gererBlocage = function (num) {
        if (this.bloques.has(num)) {
            this.bloques.delete(num);
        }
        else {
            this.bloques.add(num);
        }
        this.subjUI.next({ type: "bloquesUpdate", contenu: this.bloques });
        this.subjApp.next({ type: "updateUI", contenu: undefined });
    };
    return res;
}());
exports.res = res;
//# sourceMappingURL=res.js.map