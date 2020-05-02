var socket = new WebSocket('ws://localhost:8081/');

var num = 0;
var collaborateurs = [];
var set = [];

var bloques = [] ;
var reponse = true;

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
    num=data.num; //Lors de l'initialisation
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
        var json = JSON.stringify({ message: 'DataUpdate', numEnvoi: num, numDest : data.numEnvoi, users: JSON.stringify(collaborateurs), set: JSON.stringify(set)});
        socket.send(json);
        log('Sent: DataUpdate (' + num + '->' + data.numEnvoi + ')');
      }else if(data.message === 'DataUpdate'){
        set=JSON.parse(data.set);
        collaborateurs=JSON.parse(data.users);
        actualCollaborateurs();
        actualSet();
      }else if(data.message === 'ping'){
        var json = JSON.stringify({ message: 'pingRep', numEnvoi: num, numDest: data.numEnvoi });
        socket.send(json);
        log('Sent: pingRep (' + num + '->' + data.numEnvoi + ')');
      }else if(data.message === 'pingRep'){
        reponse=true;
      }else if(data.message === 'ping-req'){
        var json = JSON.stringify({ message: 'ping', numEnvoi: num, numDest: data.numCible });
        socket.send(json);
        log('Sent: ping (' + num + '->' + data.numCible + ')');
      
        reponse = false;
        setTimeout(function(){ 
          var json = JSON.stringify({ message: 'ping-reqRep', reponse: reponse, numEnvoi: num, numDest: data.numEnvoi });
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

socket.onclose = function(event) {
  log('Closed connection 😱');
}

document.querySelector('#close').addEventListener('click', function(event) {
  collaborateurs.splice(collaborateurs.indexOf(num),1);
  actualCollaborateurs();
  var json = JSON.stringify({ message: 'DataUpdate', numEnvoi: num, numDest : 0, users: JSON.stringify(collaborateurs), set: JSON.stringify(set)});
  socket.send(json);
  log('Sent: DataUpdate (' + num + '->' + 0 + ')'); //DEBUG normalement l'info se propage par gossiping
  socket.close();
});

document.querySelector('#broadcast').addEventListener('click', function(event) {
  var json = JSON.stringify({ message: 'Hey there, I am ' + num, numEnvoi: num, numDest: 0 });
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
        var json = JSON.stringify({ message: 'ping', numEnvoi: num, numDest: event.target.getAttribute("num") });
        socket.send(json);
        log("Sent : ping (" + num + "->" + event.target.getAttribute("num") + ')');
        
        reponse = false;
        setTimeout(function(){ 
          if(!reponse){
            log("pas de réponse au ping (collaborateur suspect)");
            var json = JSON.stringify({ message: 'ping-req', numEnvoi: num, numDest: 0, numCible: event.target.getAttribute("num") });
            socket.send(json);
            log("Sent : ping-req (" + num + "->" + 0 + "->" + event.target.getAttribute("num") + ')');
            clearTimeout();
            setTimeout(function(){
              if(reponse){
                log("Collaborateur OK");
              }else{
                log("Collaborateur mort");
                collaborateurs.splice(collaborateurs.indexOf(parseInt(event.target.getAttribute("num"))),1);
                actualCollaborateurs();
              }
            }, 2000)
          }else{
            log("réponse au ping");
          }
        }, 1000)
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