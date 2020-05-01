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
    log('Serveur: Bienvenue ' + num)
  }else if(data.numEnvoi!=num&&(data.numDest==num||data.numDest==0)){
    log('Received: ' + data.message + ' (' + data.numEnvoi + '->' + data.numDest + ')');
    if(data.message === 'DataRequest'){
      collaborateurs.push(data.numEnvoi);
      var json = JSON.stringify({ message: 'DataRequestResponse', numEnvoi: num, numDest : data.numEnvoi, users: JSON.stringify(collaborateurs), set: JSON.stringify(set)});
      socket.send(json);
      log('Sent: DataRequestResponse (' + num + '->' + data.numEnvoi + ')');
    }else if(data.message === 'DataRequestResponse'){
      set=data.set;
      collaborateurs=data.users;
    }
  }
}

socket.onclose = function(event) {
  log('Closed connection 😱');
}

document.querySelector('#close').addEventListener('click', function(event) {
  socket.close();
  log('Closed connection 😱');
});

document.querySelector('#broadcast').addEventListener('click', function(event) {
  var json = JSON.stringify({ message: 'Hey there, I am ' + num, numEnvoi: num, numDest: 0 });
  socket.send(json);
  log('Sent: ' + 'Hey there, I am ' + num);
});

var log = function(text) {
  var li = document.createElement('li');
  li.innerHTML = text;
  document.getElementById('log').appendChild(li);
}

window.addEventListener('beforeunload', function() {
  socket.close();
});
