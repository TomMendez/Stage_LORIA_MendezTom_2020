import { Subject } from 'rxjs';
var res = (function () {
    function res() {
        this.subjApp = new Subject();
        this.subjUI = new Subject();
        this.getObsApp = function () {
            return this.subjApp.asObservable();
        };
        this.getObsUI = function () {
            return this.subjUI.asObservable();
        };
        this.setObsIn = function (obs) {
            this.obs.suscribe(this.dispatcher);
        };
        this.dispatcher = function (data) {
            if (data.type === "message") {
                this.socket.send(data.contenu);
            }
            else if (data.type === "bloquage") {
                this.gererBlocage(data.contenu);
            }
            else if (data.type === "numUpdate") {
                this.num = data.contenu;
            }
            else {
                this.subjUI.next({ type: "log", contenu: "ERREUR: type inconnu dans le dispatcher res" });
            }
        };
        this.gererBlocage = function (num) {
            if (this.bloques.has(num)) {
                this.bloques.delete(num);
            }
            else {
                this.bloques.add(num);
            }
            this.subjUI.next({ type: "bloquesUpdate", contenu: JSON.stringify(Array.from(this.bloques)) });
            this.subjUI.next({ type: "updateUI", contenu: undefined });
        };
        this.bloques = new Set();
        var bloques = this.bloques;
        this.num = 0;
        var num = this.num;
        this.socket = new WebSocket('ws://localhost:8081/');
        var subjUI = this.subjUI;
        var subjApp = this.subjApp;
        this.socket.onopen = function () {
            var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0 });
            sockhttp: subjUI.next({ type: "log", contenu: "Connection établie" });
        };
        this.socket.onerror = function (event) {
            subjApp.error(event);
        };
        this.socket.onmessage = function (event) {
            if (event.data.numEnvoi !== num && (event.data.numDest === num || event.data.numDest === 0)) {
                if (bloques.has(event.data.numEnvoi)) {
                    subjApp.next({ type: "message", contenu: event.data });
                }
                else {
                    subjUI.next({ type: "log", contenu: "Message bloqué (collaborateur " + event.data.numEnvoi + ")" });
                }
            }
        };
        this.socket.onclose = function () {
            subjApp.complete();
        };
    }
    return res;
}());
export { res };
//# sourceMappingURL=res.js.map