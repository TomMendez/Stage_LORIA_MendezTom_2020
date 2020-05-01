var socket = new WebSocket('ws://localhost:8081/');

var num = 0;
var collaborateurs = [];
var set = [];

socket.onopen = function(event) {
  log('Opened connection 🎉');
  var json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
  sockhttp://localhost:8080/send(json);
  log('Envoi demande numéro au serveur');
  log('Envoi demande données aux replicas');
}

socket.onerror = function(event) {
  log('Error: ' + JSON.stringify(event));
}

socket.onmessage = function (event) {
  var data = JSON.parse(event.data);
  //log('DEBUG: ' + event.data);
  if(num==0){
    num=data.num; //Lors de l'initialisation
    collaborateurs=[num];
    actualCollaborateurs();
    actualSet();
    log('Serveur: Bienvenue ' + num)
  }else if(data.numEnvoi!=num&&(data.numDest==num||data.numDest==0)){
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
    }
  }
}

socket.onclose = function(event) {
  log('Closed connection 😱');
}

document.querySelector('#close').addEventListener('click', function(event) {
  collaborateurs.splice(collaborateurs.indexOf(num));
  actualCollaborateurs();
  var json = JSON.stringify({ message: 'DataUpdate', numEnvoi: num, numDest : 0, users: JSON.stringify(collaborateurs), set: JSON.stringify(set)});
  socket.send(json);
  log('Sent: DataUpdate (' + num + '->' + 0 + ')');
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
      log('Action: ' + char + ' was added to the set');
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
    var you = "";
    if(u==num){
      you="(you)";
    }
      $(`<li class="collabo">
            <p>Collaborateur ` + u + ' ' + you + `</p> 
            <INPUT type="submit" name="ping" value="ping">
            <INPUT type="submit" name="bloquer" value="bloquer">
          </li>`).appendTo($("#collaborateurs"));
  }
}

let actualSet = function(){
  $("#set").empty();
  $(`<p style="text-align: center">Etat acutel du set [` + set + `]</p>`).appendTo($("#set"));
}