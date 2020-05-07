var socket = new WebSocket('ws://localhost:8081/');
//Variables partagées par tous les replicas
var num = 0;
var collaborateurs = new Object();
var set = [];
//Variable de ce replica
var bloques = [];
var reponse = true;
var PG = new Object;
var incarnation = 0;
/*
Numéro des messages : 1=ping / 2=ping-req / 3=ack / 4=data-request / 5 = data-update / 6=ack(ping-req) -> DEBUGà enlever
Numéro des PG : 1=joined / 2=alive / 3=suspect / 4=confirm
*/
socket.onopen = function () {
    log('Opened connection 🎉');
    var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0 });
    sockhttp: //localhost:8080/send(json);
     log('Envoi demande numéro au serveur! ' + json);
    log('Envoi demande données aux replicas (DataRequest)');
};
socket.onerror = function (event) {
    log('Error: ' + JSON.stringify(event));
};
socket.onmessage = function (event) {
    var data = JSON.parse(event.data);
    //log('DEBUG: ' + event.data);
    if (num == 0) {
        //Initialisation du collaborateur
        num = data.num;
        $("<h1 style=\"text-align: center\">Collaborateur " + num + "</h1>").appendTo($("#titre"));
        collaborateurs[num] = "Alive";
        actualCollaborateurs();
        actualSet();
        log('Serveur: Bienvenue ' + num);
    }
    else if (data.numEnvoi !== num && (data.numDest === num || data.numDest === 0)) { //Le client n'accepte pas ses propres messages et ceux qui ne lui sont pas destinés
        if (bloques.includes(data.numEnvoi)) {
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
                    //Evaluation des propriété des messages PG
                    switch (key) {
                        case 1: //Joined
                            pgstring = "Joined";
                            if (!collaborateurs.hasOwnProperty(key)) {
                                elem.cpt = 2;
                                PG[key] = elem;
                                collaborateurs[key] = "Alive";
                            }
                            break;
                        case 2: //Alive
                            pgstring = "Alive";
                            if (collaborateurs.hasOwnProperty(key) && ((PG[key] == null) || (elem.incarn > PG[key].incarn))) {
                                elem.cpt = 2;
                                PG[key] = elem;
                                collaborateurs[key] = "Alive";
                            }
                            break;
                        case 3: //Suspect
                            pgstring = "Suspect";
                            if (key == num) {
                                incarnation++;
                                PG[key] = { message: 2, incarn: incarnation, cpt: 2 };
                            }
                            else {
                                if (collaborateurs.hasOwnProperty(key)) {
                                    var overide = false;
                                    if (elem.message = 3 && ((PG[key] == null) || elem.incarn > PG[key].incarn)) {
                                        overide = true;
                                    }
                                    else if (elem.message = 2 && ((PG[key] == null) || elem.incarn >= PG[key].incarn)) {
                                        overide = true;
                                    }
                                    if (overide) {
                                        elem.cpt = 2;
                                        PG[key] = elem;
                                        collaborateurs[key] = "Suspect";
                                    }
                                }
                            }
                            break;
                        case 4: //Confirm
                            pgstring = "Confirm";
                            if (collaborateurs.hasOwnProperty(key)) {
                                elem.cpt = 2;
                                PG[key] = elem;
                                delete collaborateurs[key];
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
                case 1: //ping
                    messtring = "ping";
                    envoyerMessageDirect(3, data.numEnvoi);
                    break;
                case 2: //ping-req
                    messtring = "ping-req";
                    envoyerMessageDirect(1, data.numCible);
                    reponse = false;
                    setTimeout(function () {
                        var toPG = new Object;
                        for (var key in PG) {
                            var elem = PG[key];
                            if (elem.cpt > 0) {
                                elem.cpt--;
                                toPG[key] = (elem);
                            }
                        }
                        ;
                        var json = JSON.stringify({ message: 6, reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, set: JSON.stringify(set), piggyback: toPG });
                        socket.send(json);
                        log("Sent : ping-reqRep " + "reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');
                    }, 250);
                    break;
                case 3: //ack
                    messtring = "ack";
                    reponse = true;
                    break;
                case 4: //data-request
                    messtring = "data-request";
                    collaborateurs[data.numEnvoi] = "Alive";
                    actualCollaborateurs();
                    envoyerMessageDirect(5, data.numEnvoi);
                    PG[data.numEnvoi] = { message: 1, incarn: incarnation, cpt: 2 };
                    break;
                case 5: //data-update
                    messtring = "data-update";
                    collaborateurs = JSON.parse(data.users);
                    actualCollaborateurs();
                    log('Données mises à jour');
                    break;
                case 6: //ack(ping-req) -> DEBUG à supprimer
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
    PG[num] = { message: 4, incarn: incarnation, cpt: 2 };
    var numRandom = Math.floor(Math.random() * Object.keys(collaborateurs).length);
    var numCollab = parseInt(Object.keys(collaborateurs)[numRandom]);
    //DEBUG pas terrible
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
        if (set.includes(char)) {
            log('SmallError: ' + char + ' already in the set');
        }
        else {
            set.push(char);
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
var actualDonnees = function (newSet) {
    for (var i = 0; i < newSet.length; i++) {
        if (!set.includes(newSet[i])) {
            set.push(newSet[i]);
        }
    }
    set.sort();
    actualSet();
};
var actualCollaborateurs = function () {
    $("#collaborateurs").empty();
    for (var k in collaborateurs) {
        var key = parseInt(k);
        if (key == num) {
            $("<li class=\"collabo\">\n            <p>Collaborateur " + key + " (you)</p> \n          </li>").appendTo($("#collaborateurs"));
        }
        else {
            var block = '';
            var state = collaborateurs[key];
            if (bloques.includes(key)) {
                block = 'X';
            }
            $("<li class=\"collabo\">\n            <p>Collaborateur " + key + ' (' + state + ') ' + block + "</p> \n            <INPUT type=\"submit\" class=\"ping\" value=\"ping\" num=\"" + key + "\">\n            <INPUT type=\"submit\" class=\"bloquer\" value=\"bloquer\" num=\"" + key + "\">\n          </li>").appendTo($("#collaborateurs"));
        }
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
                if (bloques.includes(numero)) {
                    log("deblocage: " + numero);
                    bloques.splice(bloques.indexOf(numero, 1));
                }
                else {
                    log("blocage: " + numero);
                    bloques.push(numero);
                }
                actualCollaborateurs();
            });
        });
    }
};
var actualSet = function () {
    $("#set").empty();
    $("<p style=\"text-align: center\">Etat acutel du set [" + set + "]</p>").appendTo($("#set"));
};
var envoyerMessageDirect = function (numMessage, numDest) {
    var toPG = new Object;
    for (var key in PG) {
        toPG = new Object;
        for (var key in PG) {
            var elem = PG[key];
            if (elem.cpt > 0) {
                elem.cpt--;
                toPG[key] = (elem);
            }
        }
        ;
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
    //DEBUG users est présent uniquement pour la méthode dataUpdate -> à modifier (par exemple en gardant la même méthode mais en permettant de rajouter un champ)
    var json = JSON.stringify({ message: numMessage, numEnvoi: num, numDest: numDest, users: JSON.stringify(collaborateurs), set: JSON.stringify(set), piggyback: toPG });
    socket.send(json);
    log('Sent: ' + messtring + ' (' + num + '->' + numDest + ')');
};
var pingProcedure = function (numCollab) {
    envoyerMessageDirect(1, numCollab);
    reponse = false;
    setTimeout(function () {
        var incarnActu = 0;
        if (PG[numCollab] != undefined) {
            incarnActu = PG[numCollab].incarnation;
        }
        if (!reponse) {
            PG[numCollab] = { message: 3, incarnation: incarnActu, cpt: 2 };
            log("pas de réponse au ping");
            var toPG = new Object;
            for (var key in PG) {
                var elem = PG[key];
                if (elem.cpt > 0) {
                    elem.cpt--;
                    toPG[key] = (elem);
                }
            }
            ;
            var json = JSON.stringify({ message: 2, numEnvoi: num, numDest: 0, numCible: numCollab, set: JSON.stringify(set), piggyback: toPG });
            socket.send(json);
            log("Sent : ping-req (" + num + "->" + 0 + "->" + numCollab + ')');
            for (var key in PG) {
                var elem = PG[key];
                elem.cpt--;
                if (elem.cpt < 0) {
                    log('Error: compteur d un piggyback négatif');
                }
                if (elem.cpt <= 0) {
                    delete PG[key];
                }
            }
            ;
            clearTimeout();
            setTimeout(function () {
                if (reponse) {
                    //PG[numCollab] = {message: 2, incarnation: incarnActu, cpt:2}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
                    collaborateurs[numCollab] = "Alive";
                    log("réponse au ping-req (Collaborateur OK)");
                }
                else {
                    if (collaborateurs[numCollab] === 'Alive') {
                        PG[numCollab] = { message: 3, incarnation: incarnActu, cpt: 2 };
                        collaborateurs[numCollab] = "Suspect";
                        log("Collaborateur suspect");
                    }
                    else if (collaborateurs[numCollab] === 'Suspect') {
                        PG[numCollab] = { message: 4, incarnation: incarnActu, cpt: 2 };
                        delete collaborateurs[numCollab];
                        log("Collaborateur mort");
                    }
                    else {
                        log('SmallError: collaborateur déjà mort');
                    }
                    actualCollaborateurs();
                }
            }, 1000);
        }
        else {
            //PG[numCollab] = {message: 2, incarnation: incarnActu, cpt:2}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
            log("réponse au ping (collaborateur OK)");
        }
    }, 1000);
};
//Gossiping
setInterval(function () {
    if (Object.keys(collaborateurs).length > 1 && collaborateurs.hasOwnProperty(num)) {
        var numRandom = Math.floor(Math.random() * Object.keys(collaborateurs).length);
        var numCollab = parseInt(Object.keys(collaborateurs)[numRandom]);
        //DEBUG pas terrible
        if (numCollab != num) {
            log('DEBUG: ping aléatoire sur : ' + numCollab);
            pingProcedure(numCollab);
        }
    }
}, 5000);
