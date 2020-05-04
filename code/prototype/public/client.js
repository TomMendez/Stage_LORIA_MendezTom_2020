var socket = new WebSocket('ws://localhost:8081/');

var num = 0;
var collaborateurs = new Object();
var set = [];

var bloques = [] ;
var reponse = true;
var PG = new Object;
var incarnation = 0;
//rajouter le numéro d'incarnation (init=0, +1 à chaque suspicion pour envoyer un Alive override)

//DEBUG DEBUG ajout multiple d'un même PG à corriger (si "il part puis revient") + PG qui reste trop longtemps

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
    collaborateurs[num]="Alive";
    actualCollaborateurs();
    actualSet();
    log('Serveur: Bienvenue ' + num)
  }else if(data.numEnvoi!=num&&(data.numDest==num||data.numDest==0)){
    if(bloques.includes(data.numEnvoi)){
      log("Blocage d'un message provenant de " + data.numEnvoi);
    }else{
      log('Received: ' + data.message + ' (' + data.numDest + '<-' + data.numEnvoi + ')');
      if(data.message === 'DataRequest'){
        collaborateurs[data.numEnvoi]="Alive";
        actualCollaborateurs();
        envoyerMessageDirect('DataUpdate',data.numEnvoi)
        PG[data.numEnvoi] = {message:'Joined', incarn: incarnation, cpt:2};
      }else{
        if(data.piggyback!=null){
          for(var key in data.piggyback){
            var elem = data.piggyback[key];
            log('PG: ' + elem.message + ' ' + key+ ' (' + elem.cpt + ')');
            //Evaluation des propriété des messages PG
            //Problème avec les conditions à régler
            if(elem.message='Joined'){
              if(!collaborateurs.hasOwnProperty(key)){
                PG[key]=elem;
                collaborateurs[key] = "Alive";
              }
            }else if(elem.message='Alive'){
              if(collaborateurs.hasOwnProperty(key)&&((PG[key]==null)||(elem.incarn>PG[key].incarn))){
                PG[key]=elem;
                collaborateurs[key] = "Alive";
              }
            }else if(elem.message='Suspect'){
              if(key==num){
                incarnation++;
                PG[key] = {message:'Alive', incarn: incarnation, cpt:2};
              }else{
                if(collaborateurs.hasOwnProperty(key)){
                  var overide=false;
                  if(elem.message='Suspect'&&((PG[key]==null)||elem.incarn>PG[key].incarn)){
                    overide=true;
                  }else if(elem.message='Alive'&&((PG[key]==null)||elem.incarn>=PG[key].incarn)){
                    overide=true;
                  }
                  if(overide){
                    PG[key]=elem;
                    collaborateurs[key] = "Suspect";
                  }
                }
              }
            }else if(elem.message='Confirm'){
              if(collaborateurs.hasOwnProperty(key)){
                PG[key]=elem;
                delete collaborateurs[key];
              }
            }else{
              log('SmallError: message de PG inconnu')
            }
            actualCollaborateurs();
            if(elem.cpt>0){
              delete PG[key];
            }
          }
        }
        if(data.message === 'DataUpdate'){
          collaborateurs=JSON.parse(data.users);
          log('Données mises à jour');
        }else if(data.message === 'ping'){
          envoyerMessageDirect('pingRep',data.numEnvoi)
        }else if(data.message === 'pingRep'){
          reponse=true;
        }else if(data.message === 'ping-req'){
          envoyerMessageDirect('ping',data.numCible)
        
          reponse = false;
          setTimeout(function(){ 
            for(var key in PG){
              var elem = PG[key];
              elem.cpt--;
              if(elem.cpt<0){
                log('Error: compteur d un piggyback négatif');
              }
              if(elem.cpt<=0){
                delete PG[key];
              }
            };
            var json = JSON.stringify({ message: 'ping-reqRep', reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, users: JSON.stringify(collaborateurs), set: JSON.stringify(set), piggyback: PG });
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
  delete(collaborateurs.num);
  actualCollaborateurs();
  envoyerMessageDirect('DataUpdate',0);
  socket.close();
});

document.querySelector('#broadcast').addEventListener('click', function(event) {
  //DEBUG le broadcast ne porte pas le piggybag
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
  document.getElementById('log').appendChild(li);
}

window.addEventListener('beforeunload', function() {
  socket.close();
});

let actualDonnees = function(newSet){
  set=Array.from(new Set(set.concat(newSet).sort()));
  actualCollaborateurs();
  actualSet();
}

let actualCollaborateurs = function(){
  $("#collaborateurs").empty();
  for(var key in collaborateurs) {
    if(key==num){
      $(`<li class="collabo">
            <p>Collaborateur ` + key + ` (you)</p> 
          </li>`).appendTo($("#collaborateurs"));
    }else{
      var block = '';
      var state = collaborateurs[key];
      if(bloques.includes(parseInt(key))){
        block = 'X';
      }
      $(`<li class="collabo">
            <p>Collaborateur ` + key + ' (' + state + ') ' + block + `</p> 
            <INPUT type="submit" class="ping" value="ping" num="` + key + `">
            <INPUT type="submit" class="bloquer" value="bloquer" num="` + key + `">
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
  for(var key in PG){
    var elem = PG[key];
    elem.cpt--;
    if(elem.cpt<0){
      log('Error: compteur d un piggyback négatif');
    }
    if(elem.cpt<=0){
      delete PG[key];
    }
  };
  var json = JSON.stringify({ message: nomMessage, numEnvoi: num, numDest : numDest, users: JSON.stringify(collaborateurs), set: JSON.stringify(set), piggyback: PG});
  socket.send(json);
  log('Sent: ' + nomMessage + '(' + num + '->' + numDest + ')');
}

let pingProcedure = function(numCollab){
  envoyerMessageDirect('ping',numCollab);

  reponse = false;
  setTimeout(function(){ 
    if(!reponse){
      PG[numCollab] = {message:'Suspect', incarnation: 0, cpt:2};
      log("pas de réponse au ping");

      var json = JSON.stringify({ message: 'ping-req', numEnvoi: num, numDest: 0, numCible: numCollab, users: JSON.stringify(collaborateurs), set: JSON.stringify(set), piggyback: PG });
      socket.send(json);
      log("Sent : ping-req (" + num + "->" + 0 + "->" + numCollab + ')');
      for(var key in PG){
        var elem = PG[key];
        elem.cpt--;
        if(elem.cpt<0){
          log('Error: compteur d un piggyback négatif');
        }
        if(elem.cpt<=0){
          delete PG[key];
        }
      };

      clearTimeout();
      setTimeout(function(){
        if(reponse){
          PG[numCollab] = {message:'Alive', incarnation: 0, cpt:2};
          collaborateurs[numCollab]="Alive";
          log("réponse au ping-req (Collaborateur OK)");
        }else{
          if(collaborateurs[numCollab]=='Alive'){
            PG[numCollab] = {message:'Suspect', incarnation: 0, cpt:2};
            collaborateurs[numCollab]="Suspect";
            log("Collaborateur suspect");
          }else if(collaborateurs[numCollab]=='Suspect'){
            PG[numCollab] = {message:'Confirm', incarnation: 0, cpt:2};
            delete collaborateurs[numCollab];
            log("Collaborateur mort");
          }else{
            log('SmallError: collaborateur déjà mort')
          }
          actualCollaborateurs();
        }
      }, 2000)
    }else{
      PG[numCollab] = {message:'Alive', incarnation: 0, cpt:2};
      log("réponse au ping (collaborateur OK)");
    }
  }, 1000)
}

//Gossiping
/*
setInterval(function() {
  var numRandom = Math.floor(Math.random()*collaborateurs.length);
  let numCollab = collaborateurs[numRandom];

  pingProcedure(numCollab)
},10000);
*/