var socket = new WebSocket('ws://localhost:8081/');

var num = 0;
var collaborateurs = [];
var set = [];

var bloques = [] ;
var reponse = true;

//Implementation version vector : si a > b alors les 2 garde a (et inversement) et si a || b on garde l'union des 2 ?

socket.onopen = function(event) {
  log('Opened connection 🎉');
  var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
  sockhttp://localhost:8080/send(json);
  log('Envoi demande numéro au serveur');
  log('Envoi demande données aux replicas (DataRequest)');
}

socket.onerror = function(event) {
  log('Error: ' + JSON.stringify(event));
}

socket.onmessage = function (event) {
  var data = JSON.parse(event.data);
  //log('DEBUG: ' + event.data);
  if(num==0){
    //Initialisation du collaborateur
    num=data.num; 
    $(`<h1 style="text-align: center">Collaborateur ` + num + `</h1>`).appendTo($("#titre"));
    collaborateurs=[num];
    actualCollaborateurs();
    actualSet();
    log('Serveur: Bienvenue ' + num)
  }else if(data.numEnvoi!=num&&(data.numDest==num||data.numDest==0)){
    if(bloques.includes(data.numEnvoi)){
      log("Blocage d'un message provenant de " + data.numEnvoi);
    }else{
      log('Received: ' + data.message + ' (' + data.numDest + '<-' + data.numEnvoi + ')');
      if(data.message === 'DataRequest'){
        collaborateurs.push(data.numEnvoi);
        actualCollaborateurs();
        envoyerMessageDirect('DataUpdate',data.numEnvoi)
      }else{
        actualDonnees(JSON.parse(data.users), JSON.parse(data.set));
        if(data.message === 'DataUpdate'){
          log('Données mises à jour');
        }else if(data.message === 'ping'){
          envoyerMessageDirect('pingRep',data.numEnvoi)
        }else if(data.message === 'pingRep'){
          reponse=true;
        }else if(data.message === 'ping-req'){
          envoyerMessageDirect('ping',data.numCible)
        
          reponse = false;
          setTimeout(function(){ 
            var json = JSON.stringify({ message: 'ping-reqRep', reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, users: JSON.stringify(collaborateurs), set: JSON.stringify(set) });
            socket.send(json);
            log("Sent : ping-reqRep " + "reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');    
          }, 250)
        }else if(data.message ==='ping-reqRep'){
          if(data.reponse==true){
            log("ping-req réussi");    
            reponse=true;
          }else{
            log("ping-req échoué");    
          }
        }
      }
    }
  }
}

socket.onclose = function(event) {
  log('Closed connection 😱');
}

document.querySelector('#close').addEventListener('click', function(event) {
  collaborateurs.splice(collaborateurs.indexOf(num),1);
  actualCollaborateurs();
  envoyerMessageDirect('DataUpdate',0);
  socket.close();
});

document.querySelector('#broadcast').addEventListener('click', function(event) {
  var json = JSON.stringify({ message: 'Hey there, I am ' + num, numEnvoi: num, numDest: 0, users: JSON.stringify(collaborateurs), set: JSON.stringify(set) });
  socket.send(json);
  log('Broadcasted: ' + 'Hey there, I am ' + num);
});

document.querySelector('#submbitChar').addEventListener('click', function(event) {
  var char = document.querySelector('#char').value;
  if(char!=''){
    if(set.includes(char)){
      log('SmallError: ' + char + ' already in the set');
    }else{
      set.push(char);
      log('Action: ' + char + ' was added to add the set');
      actualSet();
    }
  }else{
    log('SmallError: no char to the set');
  }
});

var log = function(text) {
  var li = document.createElement('li');
  li.innerHTML = text;
  document.getElementById('log').appendChild(li);var you = "";
}

window.addEventListener('beforeunload', function() {
  socket.close();
});

let actualDonnees = function(users, newSet){
  set=Array.from(new Set(set.concat(newSet).sort()));
  collaborateurs=users; //DEBUG solution temporaire (pas de gestion des conflits)
  actualCollaborateurs();
  actualSet();
}

let actualCollaborateurs = function(){
  $("#collaborateurs").empty();
  for(let u of collaborateurs) {
    if(u==num){
      $(`<li class="collabo">
            <p>Collaborateur ` + u + ` (you)</p> 
          </li>`).appendTo($("#collaborateurs"));
    }else{
      var block = '';
      if(bloques.includes(u)){
        block = 'X';
      }
      $(`<li class="collabo">
            <p>Collaborateur ` + u + ' ' + block + `</p> 
            <INPUT type="submit" class="ping" value="ping" num="` + u + `">
            <INPUT type="submit" class="bloquer" value="bloquer" num="` + u + `">
          </li>`).appendTo($("#collaborateurs"));
    }
  }

  if(document.querySelector('.ping')!=null){
    document.querySelectorAll('.ping').forEach(function(elem){
      elem.addEventListener('click', function(event) {

        pingProcedure(event.target.getAttribute("num"))

      });
    });

    document.querySelectorAll('.bloquer').forEach(function(elem){
      elem.addEventListener('click', function(event) {
        var numero = parseInt(event.target.getAttribute("num"));
        if(bloques.includes(numero)){
          log("deblocage: " + numero);
          bloques.splice(bloques.indexOf(numero,1));
        }else{
          log("blocage: " + numero);
          bloques.push(numero);
        }
        actualCollaborateurs();
      });
    });
  }
}

let actualSet = function(){
  $("#set").empty();
  $(`<p style="text-align: center">Etat acutel du set [` + set + `]</p>`).appendTo($("#set"));
}

let envoyerMessageDirect = function(nomMessage, numDest){
  var json = JSON.stringify({ message: nomMessage, numEnvoi: num, numDest : numDest, users: JSON.stringify(collaborateurs), set: JSON.stringify(set)});
  socket.send(json);
  log('Sent: ' + nomMessage + '(' + num + '->' + numDest + ')');
}

let pingProcedure = function(numCollab){
  envoyerMessageDirect('ping',numCollab);

  reponse = false;
  setTimeout(function(){ 
    if(!reponse){
      log("pas de réponse au ping (collaborateur suspect)");

      var json = JSON.stringify({ message: 'ping-req', numEnvoi: num, numDest: 0, numCible: numCollab, users: JSON.stringify(collaborateurs), set: JSON.stringify(set) });
      socket.send(json);
      log("Sent : ping-req (" + num + "->" + 0 + "->" + numCollab + ')');

      clearTimeout();
      setTimeout(function(){
        if(reponse){
          log("Collaborateur OK");
        }else{
          log("Collaborateur mort");
          collaborateurs.splice(collaborateurs.indexOf(parseInt(numCollab)),1);
          actualCollaborateurs();
        }
      }, 2000)
    }else{
      log("réponse au ping (collaborateur OK)");
    }
  }, 1000)
}

//Gossiping
setInterval(function() {
  var numRandom = Math.floor(Math.random()*collaborateurs.length);
  let numCollab = collaborateurs[numRandom];

  pingProcedure(numCollab)
},10000);