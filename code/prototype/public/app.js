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
import { Subject } from 'rxjs';
import { coef, K, nbPR } from './const.js';
var app = (function () {
    function app() {
        this.subjUI = new Subject();
        this.subjRes = new Subject();
        this.num = 0;
        this.collaborateurs = new Map();
        this.set = new Set();
        this.PG = new Map();
        this.incarnation = 0;
        this.reponse = true;
    }
    app.prototype.getObsUI = function () {
        return this.subjUI.asObservable();
    };
    app.prototype.getObsRes = function () {
        return this.subjRes.asObservable();
    };
    app.prototype.setObsIn = function (obs) {
        obs.subscribe(this.dispatcher);
    };
    app.prototype.dispatcher = function (data) {
        if (data.type === "message") {
            this.traiterMessage(data.contenu);
        }
        else if (data.type === "pingUI") {
            this.pingProcedure(data.contenu);
        }
        else if (data.type === "ajoutChar") {
            this.ajoutChar(data.contenu);
        }
        else if (data.type === "updateUI") {
            this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
        }
        else {
            this.subjUI.next({ type: "log", contenu: "ERREUR: type inconnu dans le dispatcher app" });
        }
    };
    app.prototype.traiterMessage = function (data) {
        var e_1, _a;
        if (this.num === 0) {
            this.num = data.num;
            this.subjRes.next({ type: "numUpdate", contenu: this.num });
            this.subjUI.next({ type: "numUpdate", contenu: this.num });
            $("<h1 style=\"text-align: center\">Collaborateur " + this.num + "</h1>").appendTo($("#titre"));
            this.collaborateurs.set(this.num, "Alive");
            this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
            this.subjUI.next({ type: "actuSet", contenu: this.set });
            this.subjUI.next({ type: "log", contenu: 'Serveur: Bienvenue ' + this.num });
        }
        else {
            var messtring = "";
            if (data.set !== [] && data.set !== undefined) {
                this.actualDonnees(JSON.parse(data.set));
            }
            if (data.piggyback != null) {
                var piggyback = new Map(JSON.parse(data.piggyback));
                try {
                    for (var piggyback_1 = __values(piggyback), piggyback_1_1 = piggyback_1.next(); !piggyback_1_1.done; piggyback_1_1 = piggyback_1.next()) {
                        var _b = __read(piggyback_1_1.value, 2), key = _b[0], elem = _b[1];
                        var pgstring = "";
                        switch (elem.message) {
                            case 1:
                                pgstring = "Joined";
                                if (!this.collaborateurs.has(key)) {
                                    elem.cpt = K;
                                    this.PG.set(key, elem);
                                    this.collaborateurs.set(key, "Alive");
                                }
                                break;
                            case 2:
                                pgstring = "Alive";
                                if (this.collaborateurs.has(key) && ((!this.PG.has(key)) || (elem.incarn > this.PG.get(key).incarn))) {
                                    elem.cpt = K;
                                    this.PG.set(key, elem);
                                    this.collaborateurs.set(key, "Alive");
                                }
                                break;
                            case 3:
                                pgstring = "Suspect";
                                if (key === this.num) {
                                    this.subjUI.next({ type: "log", contenu: 'DEBUG: démenti généré' });
                                    this.incarnation++;
                                    this.PG.set(key, { message: 2, incarn: this.incarnation, cpt: K });
                                }
                                else {
                                    if (this.collaborateurs.has(key)) {
                                        var overide = false;
                                        if ((this.PG.get(key).message === 3) && (elem.incarn > this.PG.get(key).incarn)) {
                                            overide = true;
                                        }
                                        else if ((this.PG.get(key).message === 2) && (elem.incarn >= this.PG.get(key).incarn)) {
                                            overide = true;
                                        }
                                        if (overide) {
                                            elem.cpt = K;
                                            this.PG.set(key, elem);
                                            this.collaborateurs.set(key, "Suspect");
                                        }
                                    }
                                }
                                break;
                            case 4:
                                pgstring = "Confirm";
                                if (this.collaborateurs.has(key)) {
                                    if (key === this.num) {
                                        this.subjUI.next({ type: "log", contenu: '!!! You have been declared dead' });
                                        this.subjRes.error(0);
                                    }
                                    elem.cpt = K;
                                    this.PG.set(key, elem);
                                    this.collaborateurs.delete(key);
                                }
                                break;
                            default:
                                if (key === undefined) {
                                    this.subjUI.next({ type: "log", contenu: 'Error: Piggybag on undefined' });
                                }
                                else {
                                    this.subjUI.next({ type: "log", contenu: 'SmallError: message de PG inconnu' });
                                }
                        }
                        this.subjUI.next({ type: "log", contenu: 'PG: ' + pgstring + ' ' + key + ' (' + elem.cpt + ')' });
                        this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (piggyback_1_1 && !piggyback_1_1.done && (_a = piggyback_1.return)) _a.call(piggyback_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            switch (data.message) {
                case 1:
                    messtring = "ping";
                    this.envoyerMessageDirect(3, data.numEnvoi);
                    break;
                case 2:
                    messtring = "ping-req";
                    this.envoyerMessageDirect(1, data.numCible);
                    this.reponse = false;
                    setTimeout(function () {
                        var e_2, _a;
                        var toPG = new Map();
                        try {
                            for (var _b = __values(this.PG), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                                if (value.cpt > 0) {
                                    value.cpt--;
                                    toPG.set(key, value);
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        ;
                        var json = JSON.stringify({ message: 6, reponse: this.reponse, numEnvoi: this.num, numDest: data.numEnvoi, set: JSON.stringify(Array.from(this.set)), piggyback: JSON.stringify(Array.from(toPG)) });
                        this.subjRes.next({ type: "message", contenu: json });
                        this.subjUI.next({ type: "log", contenu: "Sent : ping-reqRep reponse=" + this.reponse + " (" + this.num + "->" + data.numEnvoi + ')' });
                    }, coef);
                    break;
                case 3:
                    messtring = "ack";
                    this.reponse = true;
                    break;
                case 4:
                    messtring = "data-request";
                    this.collaborateurs.set(data.numEnvoi, "Alive");
                    this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                    this.envoyerMessageDirect(5, data.numEnvoi);
                    this.PG.set(data.numEnvoi, { message: 1, incarn: this.incarnation, cpt: K });
                    break;
                case 5:
                    messtring = "data-update";
                    this.collaborateurs = new Map(JSON.parse(data.users));
                    this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                    this.subjUI.next({ type: "log", contenu: 'Données mises à jour' });
                    break;
                case 6:
                    messtring = "ack(ping-req)";
                    if (data.reponse === true) {
                        this.subjUI.next({ type: "log", contenu: "ping-req réussi" });
                        this.reponse = true;
                    }
                    else {
                        this.subjUI.next({ type: "log", contenu: "ping-req échoué" });
                    }
                    break;
                default:
                    messtring = "?";
                    this.subjUI.next({ type: "log", contenu: 'Error: message reçu inconnu' });
            }
        }
    };
    app.prototype.envoyerMessageDirect = function (numMessage, numDest) {
        var e_3, _a;
        var toPG = new Map();
        try {
            for (var _b = __values(this.PG), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                if (value.cpt > 0) {
                    value.cpt--;
                    toPG.set(key, value);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        ;
        var messtring = "";
        switch (numMessage) {
            case 1:
                messtring = "ping";
                break;
            case 3:
                messtring = "ack";
                break;
            case 5:
                messtring = "data-update";
                break;
            default:
                messtring = "dm inconnu (" + String(numMessage) + ")";
        }
        var json = JSON.stringify({ message: numMessage, numEnvoi: this.num, numDest: numDest, users: JSON.stringify(Array.from(this.collaborateurs)), set: JSON.stringify(Array.from(this.set)), piggyback: JSON.stringify(Array.from(toPG)) });
        this.subjRes.next({ type: "message", contenu: json });
    };
    app.prototype.actualDonnees = function (nS) {
        var e_4, _a;
        var newSet = new Set(nS);
        try {
            for (var newSet_1 = __values(newSet), newSet_1_1 = newSet_1.next(); !newSet_1_1.done; newSet_1_1 = newSet_1.next()) {
                var char = newSet_1_1.value;
                this.set.add(char);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (newSet_1_1 && !newSet_1_1.done && (_a = newSet_1.return)) _a.call(newSet_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        this.set = new Set(Array.from(this.set).sort());
        this.subjUI.next({ type: "actuSet", contenu: this.set });
    };
    app.prototype.ajoutChar = function (char) {
        if (char !== '') {
            if (this.set.has(char)) {
                this.subjUI.next({ type: "log", contenu: 'SmallError: ' + char + ' already in the set' });
            }
            else {
                this.set.add(char);
                this.subjUI.next({ type: "log", contenu: 'Action: ' + char + ' was added to add the set' });
                this.subjUI.next({ type: "actuSet", contenu: this.set });
            }
        }
        else {
            this.subjUI.next({ type: "log", contenu: 'SmallError: no char to the set' });
        }
    };
    app.prototype.pingProcedure = function (numCollab) {
        this.envoyerMessageDirect(1, numCollab);
        this.reponse = false;
        setTimeout(function () {
            var e_5, _a;
            var incarnActu = 0;
            if (this.PG.has(numCollab)) {
                incarnActu = this.PG.get(numCollab).incarn;
            }
            if (!this.reponse) {
                this.subjUI.next({ type: "log", contenu: "pas de réponse au ping direct" });
                var toPG = new Map();
                try {
                    for (var _b = __values(this.PG), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                        if (value.cpt > 0) {
                            value.cpt--;
                            toPG.set(key, value);
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
                ;
                var i = nbPR;
                if (i > this.collaborateurs.size - 1) {
                    i = this.collaborateurs.size - 1;
                }
                var ens = new Set(this.collaborateurs.keys());
                ens.delete(this.num);
                ens.delete(numCollab);
                while (i > 0) {
                    var numRandom = Math.floor(Math.random() * ens.size);
                    var numCollabReq = Array.from(ens)[numRandom];
                    ens.delete(numCollabReq);
                    var json = JSON.stringify({ message: 2, numEnvoi: this.num, numDest: numCollabReq, numCible: numCollab, set: JSON.stringify(Array.from(this.set)), piggyback: JSON.stringify(Array.from(toPG)) });
                    this.subjres.next({ type: "message", contenu: json });
                    this.subjUI.next({ type: "log", contenu: "Sent : ping-req (" + this.num + "->" + numCollabReq + "->" + numCollab + ')' });
                    i--;
                }
                clearTimeout();
                setTimeout(function () {
                    if (this.reponse) {
                        this.collaborateurs.set(numCollab, "Alive");
                    }
                    else {
                        if (this.collaborateurs.get(numCollab) === 'Alive') {
                            this.PG.set(numCollab, { message: 3, incarn: incarnActu, cpt: K });
                            this.collaborateurs.set(numCollab, "Suspect");
                            this.subjUI.next({ type: "log", contenu: "Collaborateur suspect" });
                        }
                        else if (this.collaborateurs.get(numCollab) === 'Suspect') {
                            this.PG.set(numCollab, { message: 4, incarn: incarnActu, cpt: K });
                            this.collaborateurs.delete(numCollab);
                            this.subjUI.next({ type: "log", contenu: "Collaborateur mort" });
                        }
                        else {
                            this.subjUI.next({ type: "log", contenu: 'SmallError: collaborateur déjà mort' });
                        }
                        this.subjUI.next({ type: "actuCollab", contenu: this.collaborateurs });
                    }
                }, 3 * coef);
            }
            else {
                this.subjUI.next({ type: "log", contenu: "réponse au ping (collaborateur OK)" });
            }
        }, coef);
    };
    app.prototype.gossiping = function () {
        if (this.collaborateurs.size > 1 && this.collaborateurs.has(this.num)) {
            var ens = new Set(this.collaborateurs.keys());
            ens.delete(this.num);
            var numRandom = Math.floor(Math.random() * ens.size);
            var numCollab = Array.from(ens)[numRandom];
            this.subjUI.next({ type: "log", contenu: 'DEBUG: ping aléatoire sur : ' + numCollab });
            this.pingProcedure(numCollab);
        }
    };
    return app;
}());
export { app };
//# sourceMappingURL=app.js.map