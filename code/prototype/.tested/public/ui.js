"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ui = void 0;
var rxjs_1 = require("rxjs");
var ui = (function () {
    function ui() {
        this.subjApp = new rxjs_1.Subject();
        this.subjRes = new rxjs_1.Subject();
        this.bloques = new Set();
        this.num = 0;
        var vui = this;
        document.querySelector('#close').addEventListener('click', function () {
            vui.subjRes.next({ type: "stop", contenu: undefined });
            $("#titre").empty();
            $("<h1 style=\"text-align: center; color: red\">Collaborateur " + vui.num + " CONNEXION CLOSED</h1>").appendTo($("#titre"));
        });
        document.querySelector('#submbitChar').addEventListener('click', function () {
            var char = document.querySelector('#char').value;
            vui.subjApp.next({ type: "ajoutChar", contenu: char });
        });
    }
    ui.prototype.getObsApp = function () {
        return this.subjApp.asObservable();
    };
    ui.prototype.getObsRes = function () {
        return this.subjRes.asObservable();
    };
    ui.prototype.setObsIn = function (obs) {
        var _this = this;
        obs.subscribe(function (data) {
            _this.dispatcher(data);
        });
    };
    ui.prototype.dispatcher = function (data) {
        if (data.type === "log") {
            this.log(data.contenu);
        }
        else if (data.type === "actuCollab") {
            this.actualCollaborateurs(data.contenu);
        }
        else if (data.type === "actuSet") {
            this.actualSet(data.contenu);
        }
        else if (data.type === "numUpdate") {
            this.num = data.contenu;
            $("<h1 style=\"text-align: center\">Collaborateur " + this.num + "</h1>").appendTo($("#titre"));
        }
        else if (data.type === "bloquesUpdate") {
            this.bloques = data.contenu;
        }
        else if (data.type === "stop") {
            $("#titre").empty();
            $("<h1 style=\"text-align: center; color: red\">Collaborateur " + this.num + " CONNEXION CLOSED</h1>").appendTo($("#titre"));
        }
        else {
            this.log("ERREUR: type inconnu dans le dispatcher UI: " + data.type);
        }
    };
    ui.prototype.actualCollaborateurs = function (collaborateurs) {
        var e_1, _a;
        $("#collaborateurs").empty();
        try {
            for (var collaborateurs_1 = __values(collaborateurs), collaborateurs_1_1 = collaborateurs_1.next(); !collaborateurs_1_1.done; collaborateurs_1_1 = collaborateurs_1.next()) {
                var _b = __read(collaborateurs_1_1.value, 2), key = _b[0], value = _b[1];
                if (key === this.num) {
                    $("<li class=\"collabo\">\n                <p>Collaborateur " + key + " (you)</p> \n              </li>").appendTo($("#collaborateurs"));
                }
                else {
                    var block = '';
                    if (this.bloques.has(key)) {
                        block = 'X';
                    }
                    $("<li class=\"collabo\">\n                <p>Collaborateur " + key + ' (' + value + ') ' + block + "</p> \n                <INPUT type=\"submit\" class=\"ping\" value=\"ping\" num=\"" + key + "\">\n                <INPUT type=\"submit\" class=\"bloquer\" value=\"bloquer\" num=\"" + key + "\">\n              </li>").appendTo($("#collaborateurs"));
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (collaborateurs_1_1 && !collaborateurs_1_1.done && (_a = collaborateurs_1.return)) _a.call(collaborateurs_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var subjApp = this.subjApp;
        var subjRes = this.subjRes;
        if (document.querySelector('.ping') != null) {
            document.querySelectorAll('.ping').forEach(function (elem) {
                elem.addEventListener('click', function (event) {
                    var numCollab = parseInt(event.target.getAttribute("num"), 10);
                    subjApp.next({ type: "pingUI", contenu: numCollab });
                });
            });
            document.querySelectorAll('.bloquer').forEach(function (elem) {
                elem.addEventListener('click', function (event) {
                    var numero = parseInt(event.target.getAttribute("num"), 10);
                    subjRes.next({ type: "bloquage", contenu: numero });
                });
            });
        }
    };
    ui.prototype.actualSet = function (set) {
        $("#set").empty();
        $("<p style=\"text-align: center\">Etat acutel du set [" + String(Array.from(set)) + "]</p>").appendTo($("#set"));
    };
    ui.prototype.log = function (text) {
        var li = document.createElement('li');
        li.innerHTML = text;
        document.getElementById('log').appendChild(li);
    };
    return ui;
}());
exports.ui = ui;
//# sourceMappingURL=ui.js.map