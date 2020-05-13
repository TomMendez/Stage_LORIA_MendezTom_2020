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
var socket = new WebSocket('ws://localhost:8081/');
var coef = 200;
var K = 4;
var nbPR = 2;
var num = 0;
var collaborateurs = new Map();
var set = new Set();
var bloques = new Set();
var reponse = true;
var PG = new Map();
var incarnation = 0;
socket.onopen = function () {
    log('Opened connection 🎉');
    var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0 });
    sockhttp: log('Envoi demande numéro au serveur! ' + json);
    log('Envoi demande données aux replicas (DataRequest)');
};
socket.onerror = function (event) {
    log('Error: ' + JSON.stringify(event));
};
socket.onmessage = function (event) {
    var e_1, _a;
    var data = JSON.parse(event.data);
    if (num === 0) {
        num = data.num;
        $("<h1 style=\"text-align: center\">Collaborateur " + num + "</h1>").appendTo($("#titre"));
        collaborateurs.set(num, "Alive");
        actualCollaborateurs();
        actualSet();
        log('Serveur: Bienvenue ' + num);
    }
    else if (data.numEnvoi !== num && (data.numDest === num || data.numDest === 0)) {
        if (bloques.has(data.numEnvoi)) {
            log("Blocage d'un message provenant de " + data.numEnvoi);
        }
        else {
            var messtring = "";
            if (data.set !== [] && data.set !== undefined) {
                actualDonnees(JSON.parse(data.set));
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
                                if (!collaborateurs.has(key)) {
                                    elem.cpt = K;
                                    PG.set(key, elem);
                                    collaborateurs.set(key, "Alive");
                                }
                                break;
                            case 2:
                                pgstring = "Alive";
                                if (collaborateurs.has(key) && ((!PG.has(key)) || (elem.incarn > PG.get(key).incarn))) {
                                    elem.cpt = K;
                                    PG.set(key, elem);
                                    collaborateurs.set(key, "Alive");
                                }
                                break;
                            case 3:
                                pgstring = "Suspect";
                                if (key === num) {
                                    log('DEBUG: démenti généré');
                                    incarnation++;
                                    PG.set(key, { message: 2, incarn: incarnation, cpt: K });
                                }
                                else {
                                    if (collaborateurs.has(key)) {
                                        var overide = false;
                                        if ((PG.get(key).message === 3) && (elem.incarn > PG.get(key).incarn)) {
                                            overide = true;
                                        }
                                        else if ((PG.get(key).message === 2) && (elem.incarn >= PG.get(key).incarn)) {
                                            overide = true;
                                        }
                                        if (overide) {
                                            elem.cpt = K;
                                            PG.set(key, elem);
                                            collaborateurs.set(key, "Suspect");
                                        }
                                    }
                                }
                                break;
                            case 4:
                                pgstring = "Confirm";
                                if (collaborateurs.has(key)) {
                                    if (key === num) {
                                        log('!!! You have been declared dead');
                                        socket.close();
                                    }
                                    elem.cpt = K;
                                    PG.set(key, elem);
                                    collaborateurs.delete(key);
                                }
                                break;
                            default:
                                if (key === undefined) {
                                    log('Error: Piggybag on undefined');
                                }
                                else {
                                    log('SmallError: message de PG inconnu');
                                }
                        }
                        log('PG: ' + pgstring + ' ' + key + ' (' + elem.cpt + ')');
                        actualCollaborateurs();
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
                    envoyerMessageDirect(3, data.numEnvoi);
                    break;
                case 2:
                    messtring = "ping-req";
                    envoyerMessageDirect(1, data.numCible);
                    reponse = false;
                    setTimeout(function () {
                        var e_2, _a;
                        var toPG = new Map();
                        try {
                            for (var PG_1 = __values(PG), PG_1_1 = PG_1.next(); !PG_1_1.done; PG_1_1 = PG_1.next()) {
                                var _b = __read(PG_1_1.value, 2), key = _b[0], value = _b[1];
                                if (value.cpt > 0) {
                                    value.cpt--;
                                    toPG.set(key, value);
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (PG_1_1 && !PG_1_1.done && (_a = PG_1.return)) _a.call(PG_1);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        ;
                        var json = JSON.stringify({ message: 6, reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, set: JSON.stringify(Array.from(set)), piggyback: JSON.stringify(Array.from(toPG)) });
                        socket.send(json);
                        log("Sent : ping-reqRep reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');
                    }, coef);
                    break;
                case 3:
                    messtring = "ack";
                    reponse = true;
                    break;
                case 4:
                    messtring = "data-request";
                    collaborateurs.set(data.numEnvoi, "Alive");
                    actualCollaborateurs();
                    envoyerMessageDirect(5, data.numEnvoi);
                    PG.set(data.numEnvoi, { message: 1, incarn: incarnation, cpt: K });
                    break;
                case 5:
                    messtring = "data-update";
                    collaborateurs = new Map(JSON.parse(data.users));
                    actualCollaborateurs();
                    log('Données mises à jour');
                    break;
                case 6:
                    messtring = "ack(ping-req)";
                    if (data.reponse === true) {
                        log("ping-req réussi");
                        reponse = true;
                    }
                    else {
                        log("ping-req échoué");
                    }
                    break;
                default:
                    messtring = "?";
                    log('Error: message reçu inconnu');
            }
        }
    }
};
socket.onclose = function () {
    $("#titre").empty();
    $("<h1 style=\"text-align: center; color: red\">Collaborateur " + num + " CONNEXION CLOSED</h1>").appendTo($("#titre"));
    PG.set(num, { message: 4, incarn: incarnation, cpt: K });
    var ens = new Set(collaborateurs.keys());
    ens.delete(num);
    var numRandom = Math.floor(Math.random() * ens.size);
    var numCollab = Array.from(ens)[numRandom];
    log('DEBUG: ping aléatoire sur : ' + numCollab);
    envoyerMessageDirect(1, numCollab);
    log('Closed connection 😱');
};
document.querySelector('#close').addEventListener('click', function () {
    socket.close();
});
document.querySelector('#submbitChar').addEventListener('click', function () {
    var char = document.querySelector('#char').value;
    if (char !== '') {
        if (set.has(char)) {
            log('SmallError: ' + char + ' already in the set');
        }
        else {
            set.add(char);
            log('Action: ' + char + ' was added to add the set');
            actualSet();
        }
    }
    else {
        log('SmallError: no char to the set');
    }
});
var log = function (text) {
    var li = document.createElement('li');
    li.innerHTML = text;
    document.getElementById('log').appendChild(li);
};
window.addEventListener('beforeunload', function () {
    socket.close();
});
var actualDonnees = function (nS) {
    var e_3, _a;
    var newSet = new Set(nS);
    try {
        for (var newSet_1 = __values(newSet), newSet_1_1 = newSet_1.next(); !newSet_1_1.done; newSet_1_1 = newSet_1.next()) {
            var char = newSet_1_1.value;
            set.add(char);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (newSet_1_1 && !newSet_1_1.done && (_a = newSet_1.return)) _a.call(newSet_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    set = new Set(Array.from(set).sort());
    actualSet();
};
var actualCollaborateurs = function () {
    var e_4, _a;
    $("#collaborateurs").empty();
    try {
        for (var collaborateurs_1 = __values(collaborateurs), collaborateurs_1_1 = collaborateurs_1.next(); !collaborateurs_1_1.done; collaborateurs_1_1 = collaborateurs_1.next()) {
            var _b = __read(collaborateurs_1_1.value, 2), key = _b[0], value = _b[1];
            if (key === num) {
                $("<li class=\"collabo\">\n            <p>Collaborateur " + key + " (you)</p> \n          </li>").appendTo($("#collaborateurs"));
            }
            else {
                var block = '';
                if (bloques.has(key)) {
                    block = 'X';
                }
                $("<li class=\"collabo\">\n            <p>Collaborateur " + key + ' (' + value + ') ' + block + "</p> \n            <INPUT type=\"submit\" class=\"ping\" value=\"ping\" num=\"" + key + "\">\n            <INPUT type=\"submit\" class=\"bloquer\" value=\"bloquer\" num=\"" + key + "\">\n          </li>").appendTo($("#collaborateurs"));
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (collaborateurs_1_1 && !collaborateurs_1_1.done && (_a = collaborateurs_1.return)) _a.call(collaborateurs_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    if (document.querySelector('.ping') != null) {
        document.querySelectorAll('.ping').forEach(function (elem) {
            elem.addEventListener('click', function (event) {
                pingProcedure(parseInt(event.target.getAttribute("num"), 10));
            });
        });
        document.querySelectorAll('.bloquer').forEach(function (elem) {
            elem.addEventListener('click', function (event) {
                var numero = parseInt(event.target.getAttribute("num"), 10);
                if (bloques.has(numero)) {
                    log("deblocage: " + numero);
                    bloques.delete(numero);
                }
                else {
                    log("blocage: " + numero);
                    bloques.add(numero);
                }
                actualCollaborateurs();
            });
        });
    }
};
var actualSet = function () {
    $("#set").empty();
    $("<p style=\"text-align: center\">Etat acutel du set [" + String(Array.from(set)) + "]</p>").appendTo($("#set"));
};
var envoyerMessageDirect = function (numMessage, numDest) {
    var e_5, _a;
    var toPG = new Map();
    try {
        for (var PG_2 = __values(PG), PG_2_1 = PG_2.next(); !PG_2_1.done; PG_2_1 = PG_2.next()) {
            var _b = __read(PG_2_1.value, 2), key = _b[0], value = _b[1];
            if (value.cpt > 0) {
                value.cpt--;
                toPG.set(key, value);
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (PG_2_1 && !PG_2_1.done && (_a = PG_2.return)) _a.call(PG_2);
        }
        finally { if (e_5) throw e_5.error; }
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
    var json = JSON.stringify({ message: numMessage, numEnvoi: num, numDest: numDest, users: JSON.stringify(Array.from(collaborateurs)), set: JSON.stringify(Array.from(set)), piggyback: JSON.stringify(Array.from(toPG)) });
    socket.send(json);
};
var pingProcedure = function (numCollab) {
    envoyerMessageDirect(1, numCollab);
    reponse = false;
    setTimeout(function () {
        var e_6, _a;
        var incarnActu = 0;
        if (PG.has(numCollab)) {
            incarnActu = PG.get(numCollab).incarn;
        }
        if (!reponse) {
            log("pas de réponse au ping direct");
            var toPG = new Map();
            try {
                for (var PG_3 = __values(PG), PG_3_1 = PG_3.next(); !PG_3_1.done; PG_3_1 = PG_3.next()) {
                    var _b = __read(PG_3_1.value, 2), key = _b[0], value = _b[1];
                    if (value.cpt > 0) {
                        value.cpt--;
                        toPG.set(key, value);
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (PG_3_1 && !PG_3_1.done && (_a = PG_3.return)) _a.call(PG_3);
                }
                finally { if (e_6) throw e_6.error; }
            }
            ;
            var i = nbPR;
            if (i > collaborateurs.size - 1) {
                i = collaborateurs.size - 1;
            }
            var ens = new Set(collaborateurs.keys());
            ens.delete(num);
            ens.delete(numCollab);
            while (i > 0) {
                var numRandom = Math.floor(Math.random() * ens.size);
                var numCollabReq = Array.from(ens)[numRandom];
                ens.delete(numCollabReq);
                var json = JSON.stringify({ message: 2, numEnvoi: num, numDest: numCollabReq, numCible: numCollab, set: JSON.stringify(Array.from(set)), piggyback: JSON.stringify(Array.from(toPG)) });
                socket.send(json);
                log("Sent : ping-req (" + num + "->" + numCollabReq + "->" + numCollab + ')');
                i--;
            }
            clearTimeout();
            setTimeout(function () {
                if (reponse) {
                    collaborateurs.set(numCollab, "Alive");
                }
                else {
                    if (collaborateurs.get(numCollab) === 'Alive') {
                        PG.set(numCollab, { message: 3, incarn: incarnActu, cpt: K });
                        collaborateurs.set(numCollab, "Suspect");
                        log("Collaborateur suspect");
                    }
                    else if (collaborateurs.get(numCollab) === 'Suspect') {
                        PG.set(numCollab, { message: 4, incarn: incarnActu, cpt: K });
                        collaborateurs.delete(numCollab);
                        log("Collaborateur mort");
                    }
                    else {
                        log('SmallError: collaborateur déjà mort');
                    }
                    actualCollaborateurs();
                }
            }, 3 * coef);
        }
        else {
            log("réponse au ping (collaborateur OK)");
        }
    }, coef);
};
setInterval(function () {
    if (collaborateurs.size > 1 && collaborateurs.has(num)) {
        var ens = new Set(collaborateurs.keys());
        ens.delete(num);
        var numRandom = Math.floor(Math.random() * ens.size);
        var numCollab = Array.from(ens)[numRandom];
        log('DEBUG: ping aléatoire sur : ' + numCollab);
        pingProcedure(numCollab);
    }
}, 10 * coef);
//# sourceMappingURL=client.js.map