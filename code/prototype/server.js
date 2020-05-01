/*
Le serveur à plusieurs rôles :
  - Attribuer un numéro à chaque client lors de leupremireèr  connexion
  - Permettre aux clients de se joindre :
    * Après avoir reçu un numéro, le serveur choisi 2 client aux hasard pour envoyer leur données au nouveau client
    * Il doit pouvoir erlayer les ping, ping-req et ACK (en broadcastant, le client ignore un message qui n'a pas le bon numéro de destinataire)


Si numEnvoi = 0 : Le client doit reçevoir un numéro
Si numDest = 0 : Le message est transmis à 2 replica au hasard (potentiellement la source)
Si numDest = -1 : Le serveur ne renvoie pas le message
*/

var http = require('http');
var express = require('express');
var WSS = require('ws').Server;
var compteur=0;

var app = express().use(express.static('public'));
var server = http.createServer(app);
server.listen(8080, '127.0.0.1');

var wss = new WSS({ port: 8081 });
wss.on('connection', function(socket) {
  console.log('Opened Connection 🎉');

  compteur++;
  var json = JSON.stringify({ message: 'Gotcha ' + compteur, num: compteur});
  socket.send(json);
  console.log('Sent: ' + json);

  wss.clients.forEach(function each(client) {
    //DEBUG pour l'instant, c'est tous les clients que reçoievnt la DataRequest
    var json = JSON.stringify({ message: 'DataRequest', numEnvoi: compteur, numDest: 0 });
    client.send(json);
    console.log('Sent: ' + json);
  });

  socket.on('message', function(message) {
    wss.clients.forEach(function each(client) {
      client.send(message);
    });
  });

  socket.on('close', function() {
    console.log('Closed Connection 😱');
  });

});