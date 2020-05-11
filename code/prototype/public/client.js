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
var coef = 500;
var K = 3;
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
    var data = JSON.parse(event.data);
    if (num == 0) {
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
            if (data.set != [] && data.set != undefined) {
                actualDonnees(JSON.parse(data.set));
            }
            if (data.piggyback != null) {
                for (var k in data.piggyback) {
                    var key = parseInt(k);
                    var elem = data.piggyback[key];
                    var pgstring = "";
                    switch (key) {
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
                            if (collaborateurs.has(key) && ((PG.get(key) == null) || (elem.incarn > PG.get(key).incarn))) {
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
                                    if (elem.message == 3 && ((PG.get(key) == null) || elem.incarn > PG.get(key).incarn)) {
                                        overide = true;
                                    }
                                    else if (elem.message == 2 && ((PG.get(key) == null) || elem.incarn >= PG.get(key).incarn)) {
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
                            if (collaborateurs.hasOwnProperty(key)) {
                                if (key === num) {
                                    log('/!\ You have been declared dead');
                                    socket.close();
                                }
                                elem.cpt = K;
                                PG.set(key, elem);
                                collaborateurs.delete(key);
                            }
                            break;
                        default:
                            if (key == undefined) {
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
                        var e_1, _a;
                        var toPG = new Map();
                        try {
                            for (var PG_1 = __values(PG), PG_1_1 = PG_1.next(); !PG_1_1.done; PG_1_1 = PG_1.next()) {
                                var _b = __read(PG_1_1.value, 2), key = _b[0], value = _b[1];
                                var elem = PG.get(key);
                                if (elem.cpt > 0) {
                                    elem.cpt--;
                                    toPG.set(key, elem);
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (PG_1_1 && !PG_1_1.done && (_a = PG_1.return)) _a.call(PG_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        ;
                        var json = JSON.stringify({ message: 6, reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, set: JSON.stringify(Array.from(set)), piggyback: toPG });
                        socket.send(json);
                        log("Sent : ping-reqRep " + "reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');
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
            log('Received: ' + messtring + ' (' + data.numDest + '<-' + data.numEnvoi + ')');
        }
    }
};
socket.onclose = function () {
    $("#titre").empty();
    $("<h1 style=\"text-align: center; color: red\">Collaborateur " + num + " CONNECTION CLOSED</h1>").appendTo($("#titre"));
    PG.set(num, { message: 4, incarn: incarnation, cpt: K });
    var numRandom = Math.floor(Math.random() * Object.keys(collaborateurs).length);
    var numCollab = parseInt(Object.keys(collaborateurs)[numRandom]);
    if (numCollab != num) {
        numRandom = Math.floor(Math.random() * Object.keys(collaborateurs).length);
        numCollab = parseInt(Object.keys(collaborateurs)[numRandom]);
    }
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
    var e_2, _a;
    var newSet = new Set(nS);
    try {
        for (var newSet_1 = __values(newSet), newSet_1_1 = newSet_1.next(); !newSet_1_1.done; newSet_1_1 = newSet_1.next()) {
            var char = newSet_1_1.value;
            set.add(char);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (newSet_1_1 && !newSet_1_1.done && (_a = newSet_1.return)) _a.call(newSet_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    set = new Set(Array.from(set).sort());
    actualSet();
};
var actualCollaborateurs = function () {
    var e_3, _a;
    $("#collaborateurs").empty();
    try {
        for (var collaborateurs_1 = __values(collaborateurs), collaborateurs_1_1 = collaborateurs_1.next(); !collaborateurs_1_1.done; collaborateurs_1_1 = collaborateurs_1.next()) {
            var _b = __read(collaborateurs_1_1.value, 2), key = _b[0], value = _b[1];
            if (key == num) {
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
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (collaborateurs_1_1 && !collaborateurs_1_1.done && (_a = collaborateurs_1.return)) _a.call(collaborateurs_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    if (document.querySelector('.ping') != null) {
        document.querySelectorAll('.ping').forEach(function (elem) {
            elem.addEventListener('click', function (event) {
                pingProcedure(parseInt(event.target.getAttribute("num")));
            });
        });
        document.querySelectorAll('.bloquer').forEach(function (elem) {
            elem.addEventListener('click', function (event) {
                var numero = parseInt(event.target.getAttribute("num"));
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
    var e_4, _a;
    var toPG = new Map();
    try {
        for (var PG_2 = __values(PG), PG_2_1 = PG_2.next(); !PG_2_1.done; PG_2_1 = PG_2.next()) {
            var _b = __read(PG_2_1.value, 2), key = _b[0], value = _b[1];
            var elem = PG.get(key);
            if (elem.cpt > 0) {
                elem.cpt--;
                toPG.set(key, elem);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (PG_2_1 && !PG_2_1.done && (_a = PG_2.return)) _a.call(PG_2);
        }
        finally { if (e_4) throw e_4.error; }
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
    var json = JSON.stringify({ message: numMessage, numEnvoi: num, numDest: numDest, users: JSON.stringify(Array.from(collaborateurs)), set: JSON.stringify(Array.from(set)), piggyback: toPG });
    socket.send(json);
    log('Sent: ' + messtring + ' (' + num + '->' + numDest + ')');
};
var pingProcedure = function (numCollab) {
    envoyerMessageDirect(1, numCollab);
    reponse = false;
    setTimeout(function () {
        var e_5, _a;
        var incarnActu = 0;
        if (PG.get(numCollab) != undefined) {
            incarnActu = PG.get(numCollab).incarnation;
        }
        if (!reponse) {
            PG.set(numCollab, { message: 3, incarnation: incarnActu, cpt: K });
            log("pas de réponse au ping");
            var toPG = new Map();
            try {
                for (var PG_3 = __values(PG), PG_3_1 = PG_3.next(); !PG_3_1.done; PG_3_1 = PG_3.next()) {
                    var _b = __read(PG_3_1.value, 2), key = _b[0], value = _b[1];
                    var elem = PG.get(key);
                    if (elem.cpt > 0) {
                        elem.cpt--;
                        toPG.set(key, elem);
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (PG_3_1 && !PG_3_1.done && (_a = PG_3.return)) _a.call(PG_3);
                }
                finally { if (e_5) throw e_5.error; }
            }
            ;
            var json = JSON.stringify({ message: 2, numEnvoi: num, numDest: 0, numCible: numCollab, set: JSON.stringify(Array.from(set)), piggyback: toPG });
            socket.send(json);
            log("Sent : ping-req (" + num + "->" + 0 + "->" + numCollab + ')');
            clearTimeout();
            setTimeout(function () {
                if (reponse) {
                    collaborateurs.set(numCollab, "Alive");
                    log("réponse au ping-req (Collaborateur OK)");
                }
                else {
                    if (collaborateurs.get(numCollab) === 'Alive') {
                        PG.set(numCollab, { message: 3, incarnation: incarnActu, cpt: K });
                        collaborateurs.set(numCollab, "Suspect");
                        log("Collaborateur suspect");
                    }
                    else if (collaborateurs.get(numCollab) === 'Suspect') {
                        PG.set(numCollab, { message: 4, incarnation: incarnActu, cpt: K });
                        collaborateurs.delete(numCollab);
                        log("Collaborateur mort");
                    }
                    else {
                        log('SmallError: collaborateur déjà mort');
                    }
                    actualCollaborateurs();
                }
            }, 2 * coef);
        }
        else {
            log("réponse au ping (collaborateur OK)");
        }
    }, coef);
};
setInterval(function () {
    if (collaborateurs.size > 1 && collaborateurs.has(num)) {
        var numRandom = Math.floor(Math.random() * collaborateurs.size);
        var numCollab = Array.from(collaborateurs)[numRandom][0];
        if (numCollab != num) {
            log('DEBUG: ping aléatoire sur : ' + numCollab);
            pingProcedure(numCollab);
        }
    }
}, 6 * coef);
//# sourceMappingURL=client.js.map