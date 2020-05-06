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
            log('Received: ' + data.message + ' (' + data.numDest + '<-' + data.numEnvoi + ')');
            if (data.message === 'DataRequest') {
                collaborateurs[data.numEnvoi] = "Alive";
                actualCollaborateurs();
                envoyerMessageDirect('DataUpdate', data.numEnvoi);
                PG[data.numEnvoi] = { message: 'Joined', incarn: incarnation, cpt: 2 };
            }
            else {
                if (data.set != []) {
                    actualDonnees(JSON.parse(data.set));
                }
                if (data.piggyback != null) {
                    for (var k in data.piggyback) {
                        var key = parseInt(k);
                        var elem = data.piggyback[key];
                        log('PG: ' + elem.message + ' ' + key + ' (' + elem.cpt + ')');
                        //Evaluation des propriété des messages PG
                        if (key == undefined) {
                            log('Error: Piggybag on undefined');
                        }
                        else if (elem.message === 'Joined') {
                            if (!collaborateurs.hasOwnProperty(key)) {
                                elem.cpt = 2;
                                PG[key] = elem;
                                collaborateurs[key] = "Alive";
                            }
                        }
                        else if (elem.message === 'Alive') {
                            if (collaborateurs.hasOwnProperty(key) && ((PG[key] == null) || (elem.incarn > PG[key].incarn))) {
                                elem.cpt = 2;
                                PG[key] = elem;
                                collaborateurs[key] = "Alive";
                            }
                        }
                        else if (elem.message === 'Suspect') {
                            if (key == num) {
                                incarnation++;
                                PG[key] = { message: 'Alive', incarn: incarnation, cpt: 2 };
                            }
                            else {
                                if (collaborateurs.hasOwnProperty(key)) {
                                    var overide = false;
                                    if (elem.message = 'Suspect' && ((PG[key] == null) || elem.incarn > PG[key].incarn)) {
                                        overide = true;
                                    }
                                    else if (elem.message = 'Alive' && ((PG[key] == null) || elem.incarn >= PG[key].incarn)) {
                                        overide = true;
                                    }
                                    if (overide) {
                                        elem.cpt = 2;
                                        PG[key] = elem;
                                        collaborateurs[key] = "Suspect";
                                    }
                                }
                            }
                        }
                        else if (elem.message === 'Confirm') {
                            if (collaborateurs.hasOwnProperty(key)) {
                                elem.cpt = 2;
                                PG[key] = elem;
                                delete collaborateurs[key];
                            }
                        }
                        else {
                            log('SmallError: message de PG inconnu');
                        }
                        actualCollaborateurs();
                    }
                }
                if (data.message === 'DataUpdate') {
                    collaborateurs = JSON.parse(data.users);
                    actualCollaborateurs();
                    log('Données mises à jour');
                }
                else if (data.message === 'ping') {
                    envoyerMessageDirect('pingRep', data.numEnvoi);
                }
                else if (data.message === 'pingRep') {
                    reponse = true;
                }
                else if (data.message === 'ping-req') {
                    envoyerMessageDirect('ping', data.numCible);
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
                        var json = JSON.stringify({ message: 'ping-reqRep', reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, set: JSON.stringify(set), piggyback: toPG });
                        socket.send(json);
                        log("Sent : ping-reqRep " + "reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');
                    }, 250);
                }
                else if (data.message === 'ping-reqRep') {
                    if (data.reponse === true) {
                        log("ping-req réussi");
                        reponse = true;
                    }
                    else {
                        log("ping-req échoué");
                    }
                }
            }
        }
    }
};
socket.onclose = function () {
    delete collaborateurs[num];
    actualCollaborateurs();
    //DEBUG Propage un dernier Confirm(num)
    log('Closed connection 😱');
};
document.querySelector('#close').addEventListener('click', function () {
    socket.close();
});
document.querySelector('#broadcast').addEventListener('click', function () {
    //DEBUG le broadcast ne porte pas le piggybag
    var json = JSON.stringify({ message: 'Hey there, I am ' + num, numEnvoi: num, numDest: 0, set: JSON.stringify(set) });
    socket.send(json);
    log('Broadcasted: ' + 'Hey there, I am ' + num);
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
var envoyerMessageDirect = function (nomMessage, numDest) {
    for (var key in PG) {
        var toPG = new Object;
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
    //DEBUG users est présent uniquement pour la méthode dataUpdate -> à modifier (par exemple en gardant la même méthode mais en permettant de rajouter un champ)
    var json = JSON.stringify({ message: nomMessage, numEnvoi: num, numDest: numDest, users: JSON.stringify(collaborateurs), set: JSON.stringify(set), piggyback: toPG });
    socket.send(json);
    log('Sent: ' + nomMessage + '(' + num + '->' + numDest + ')');
};
var pingProcedure = function (numCollab) {
    envoyerMessageDirect('ping', numCollab);
    reponse = false;
    setTimeout(function () {
        if (!reponse) {
            PG[numCollab] = { message: 'Suspect', incarnation: 0, cpt: 2 };
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
            var json = JSON.stringify({ message: 'ping-req', numEnvoi: num, numDest: 0, numCible: numCollab, set: JSON.stringify(set), piggyback: toPG });
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
                    PG[numCollab] = { message: 'Alive', incarnation: 0, cpt: 2 };
                    collaborateurs[numCollab] = "Alive";
                    log("réponse au ping-req (Collaborateur OK)");
                }
                else {
                    if (collaborateurs[numCollab] === 'Alive') {
                        PG[numCollab] = { message: 'Suspect', incarnation: 0, cpt: 2 };
                        collaborateurs[numCollab] = "Suspect";
                        log("Collaborateur suspect");
                    }
                    else if (collaborateurs[numCollab] === 'Suspect') {
                        PG[numCollab] = { message: 'Confirm', incarnation: 0, cpt: 2 };
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
            PG[numCollab] = { message: 'Alive', incarnation: 0, cpt: 2 };
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
