const socket = new WebSocket('ws://localhost:8081/');



//paramètres de la simulation
const coef = 200; //coefficient appliqué à tous les délais (timeouts / fréquence de ping aléatoires)
const K = 4; //K est le nombre de personnes à qui ont transmet les messages de PG
const nbPR = 2; //nbPR est le nombre de client qui reçoivent un ping-req dans la pingProcedure (ou moins si il n'y pas assez de clients)

interface messPG {
  message: number;
  incarn: number;
  cpt: number;
}

//Variables partagées par tous les replicas
let num = 0;
let collaborateurs : Map<number,string> = new Map();
let set : Set<string> = new Set();

//Variables de ce replica
const bloques : Set<number> = new Set();
let reponse = true;
const PG : Map<number,messPG> = new Map();
let incarnation = 0;

/*
Numéro des messages : 1=ping / 2=ping-req / 3=ack / 4=data-request / 5 = data-update / 6=ack(ping-req) -> DEBUG  à enlever
Numéro des PG : 1=joined / 2=alive / 3=suspect / 4=confirm
*/

socket.onopen = function() {
  log('Opened connection 🎉');
  const json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
  sockhttp://localhost:8080/send(json);
  log('Envoi demande numéro au serveur! ' + json);
  log('Envoi demande données aux replicas (DataRequest)');
}

socket.onerror = function(event) {
  log('Error: ' + JSON.stringify(event));
}

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  //log('DEBUG: ' + event.data);
  if(num===0){
    //Initialisation du collaborateur
    num=data.num; 
    $(`<h1 style="text-align: center">Collaborateur ` + num + `</h1>`).appendTo($("#titre"));
    collaborateurs.set(num,"Alive");
    actualCollaborateurs();
    actualSet();
    log('Serveur: Bienvenue ' + num);
  }else if(data.numEnvoi!==num&&(data.numDest===num||data.numDest===0)){ //Le client n'accepte pas ses propres messages et ceux qui ne lui sont pas destinés
    if(bloques.has(data.numEnvoi)){
      log("Blocage d'un message provenant de " + data.numEnvoi);
    }else{
      let messtring="";
      if(data.set!==[]&&data.set!==undefined){
        actualDonnees(JSON.parse(data.set));
      }
      if(data.piggyback!=null){
        const piggyback : Map<number,messPG> = new Map(JSON.parse(data.piggyback));
        for(const [key,elem] of piggyback){
          let pgstring = "";
             
          //Evaluation des propriété des messages PG
          switch(elem.message){
            case 1: //Joined
              pgstring="Joined";
              if(!collaborateurs.has(key)){
                elem.cpt=K;
                PG.set(key,elem);
                collaborateurs.set(key,"Alive");
              }
              break;
            case 2: //Alive
              pgstring="Alive";
              if(collaborateurs.has(key)&&((!PG.has(key))||(elem.incarn>PG.get(key)!.incarn))){
                elem.cpt=K;
                PG.set(key,elem);
                collaborateurs.set(key,"Alive");
              }
              break;
            case 3: //Suspect
              pgstring="Suspect";
              if(key===num){
                log('DEBUG: démenti généré');
                incarnation++;
                PG.set(key,{message:2, incarn: incarnation, cpt:K});
              }else{
                if(collaborateurs.has(key)){
                  let overide=false;
                  if((PG.get(key)!.message===3)&&(elem.incarn>PG.get(key)!.incarn)){
                    overide=true;
                  }else if((PG.get(key)!.message===2)&&(elem.incarn>=PG.get(key)!.incarn)){
                    overide=true;
                  }
                  if(overide){
                    elem.cpt=K;
                    PG.set(key,elem);
                    collaborateurs.set(key,"Suspect");
                  }
                }
              }
              break;
            case 4: //Confirm
              pgstring="Confirm";
              if(collaborateurs.has(key)){
                if(key===num){
                  log('!!! You have been declared dead');
                  socket.close();
                }
                elem.cpt=K;
                PG.set(key,elem);
                collaborateurs.delete(key);
              }
              break;
            default:
              if(key===undefined){
                log('Error: Piggybag on undefined');
              }else{
                log('SmallError: message de PG inconnu');
              }
          }
          log('PG: ' + pgstring + ' ' +  key + ' (' + elem.cpt + ')');
          actualCollaborateurs();
        }
      }
      switch(data.message){
        case 1: //ping
          messtring="ping";
          envoyerMessageDirect(3,data.numEnvoi);
          break;
        case 2: //ping-req
          messtring="ping-req";
          envoyerMessageDirect(1,data.numCible)
        
          reponse = false;
          setTimeout(function(){ 
            const toPG : Map<number,messPG> = new Map();
            for(const [key,value] of PG){
              if(value.cpt>0){
                value.cpt--;
                toPG.set(key,value);
              }
            };
            const json = JSON.stringify({ message: 6, reponse: reponse, numEnvoi: num, numDest: data.numEnvoi, set: JSON.stringify(Array.from(set)), piggyback: JSON.stringify(Array.from(toPG))});
            socket.send(json);
            log("Sent : ping-reqRep reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');    
          }, coef)
          break;
        case 3: //ack
          messtring="ack";
          reponse=true;
          break;
        case 4: //data-request
          messtring="data-request";
          collaborateurs.set(data.numEnvoi,"Alive");
          actualCollaborateurs();
          envoyerMessageDirect(5,data.numEnvoi)
          PG.set(data.numEnvoi,{message:1, incarn: incarnation, cpt:K});
          break;
        case 5: //data-update
          messtring="data-update";
          collaborateurs=new Map(JSON.parse(data.users));
          actualCollaborateurs();
          log('Données mises à jour');
          break;
        case 6: //ack(ping-req) -> DEBUG à supprimer
          messtring="ack(ping-req)"
          if(data.reponse===true){
            log("ping-req réussi");    
            reponse=true;
          }else{
            log("ping-req échoué");    
          }
          break;
        default:
          messtring="?";
          log('Error: message reçu inconnu')
      }
      //log('Received: ' + messtring + ' (' + data.numDest + '<-' + data.numEnvoi + ')');
    }
  }
}

socket.onclose = function() {
  $("#titre").empty();
  $(`<h1 style="text-align: center; color: red">Collaborateur ` + num + ` CONNEXION CLOSED</h1>`).appendTo($("#titre"));

  PG.set(num,{message:4, incarn: incarnation, cpt:K});

  const ens : Set<number> = new Set(collaborateurs.keys());
  ens.delete(num);
    
  const numRandom = Math.floor(Math.random()*ens.size);
  const numCollab = Array.from(ens)[numRandom];

  log('DEBUG: ping aléatoire sur : ' + numCollab);
  envoyerMessageDirect(1,numCollab);
  log('Closed connection 😱');
}

document.querySelector('#close')!.addEventListener('click', function() {
  socket.close();
});

document.querySelector('#submbitChar')!.addEventListener('click', function() {
  const char = (<HTMLTextAreaElement>document.querySelector('#char')).value;
  if(char!==''){
    if(set.has(char)){
      log('SmallError: ' + char + ' already in the set');
    }else{
      set.add(char);
      log('Action: ' + char + ' was added to add the set');
      actualSet();
    }
  }else{
    log('SmallError: no char to the set');
  }
});

const log = function(text : string) {
  const li = document.createElement('li');
  li.innerHTML = text;
  document.getElementById('log')!.appendChild(li);
}

window.addEventListener('beforeunload', function() {
  socket.close();
});

const actualDonnees = function(nS:Array<string>){
  const newSet = new Set(nS);
  for(const char of newSet){
    set.add(char);
  }
  set = new Set(Array.from(set).sort());
  actualSet();
}

const actualCollaborateurs = function(){
  $("#collaborateurs").empty();
  for(const [key,value] of collaborateurs) {
    if(key===num){
      $(`<li class="collabo">
            <p>Collaborateur ` + key + ` (you)</p> 
          </li>`).appendTo($("#collaborateurs"));
    }else{
      let block = '';
      if(bloques.has(key)){
        block = 'X';
      }
      $(`<li class="collabo">
            <p>Collaborateur ` + key + ' (' + value + ') ' + block + `</p> 
            <INPUT type="submit" class="ping" value="ping" num="` + key + `">
            <INPUT type="submit" class="bloquer" value="bloquer" num="` + key + `">
          </li>`).appendTo($("#collaborateurs"));
    }
  }

  if(document.querySelector('.ping')!=null){
    document.querySelectorAll('.ping').forEach(function(elem){
      elem.addEventListener('click', function(event) {

        pingProcedure(parseInt((<HTMLTextAreaElement>event.target).getAttribute("num")!,10))

      });
    });

    document.querySelectorAll('.bloquer').forEach(function(elem){
      elem.addEventListener('click', function(event) {
        const numero = parseInt((<HTMLTextAreaElement>event.target).getAttribute("num")!,10);
        if(bloques.has(numero)){
          log("deblocage: " + numero);
          bloques.delete(numero);
        }else{
          log("blocage: " + numero);
          bloques.add(numero);
        }
        actualCollaborateurs();
      });
    });
  }
}

const actualSet = function(){
  $("#set").empty();
  $(`<p style="text-align: center">Etat acutel du set [` + String(Array.from(set)) + `]</p>`).appendTo($("#set"));
}

const envoyerMessageDirect = function(numMessage : number, numDest:number){
  const toPG : Map<number,messPG> = new Map();
  for(const [key,value] of PG){
    if(value.cpt>0){
      value.cpt--;
      toPG.set(key,value);
    }
  };
  let messtring="";
  switch(numMessage){
    case 1:
      messtring="ping";
      break;
    case 3:
      messtring="ack";
      break;
    case 5:
      messtring="data-update";
      break;
    default:
      messtring="dm inconnu (" + String(numMessage) + ")";
  }

  //DEBUG users est présent uniquement pour la méthode dataUpdate -> à modifier (par exemple en gardant la même méthode mais en permettant de rajouter un champ)
  const json = JSON.stringify({ message: numMessage, numEnvoi: num, numDest : numDest, users: JSON.stringify(Array.from(collaborateurs)), set: JSON.stringify(Array.from(set)), piggyback: JSON.stringify(Array.from(toPG))});
  socket.send(json);
  //log('Sent: ' + messtring + ' (' + num + '->' + numDest + ')');
}

const pingProcedure = function(numCollab:number){
  envoyerMessageDirect(1,numCollab);

  reponse = false;
  setTimeout(function(){ 
    let incarnActu : number = 0;
    if(PG.has(numCollab)){
      incarnActu=PG.get(numCollab)!.incarn;
    }
    if(!reponse){
      log("pas de réponse au ping direct");

      const toPG : Map<number,messPG> = new Map();
      for(const [key,value] of PG){
        if(value.cpt>0){
          value.cpt--;
          toPG.set(key,value);
        }
      };
      let i = nbPR;
      if(i>collaborateurs.size-1){
        i=collaborateurs.size-1;
      }
      const ens : Set<number> = new Set(collaborateurs.keys());
      ens.delete(num);
      ens.delete(numCollab);
      while(i>0){
        const numRandom = Math.floor(Math.random()*ens.size);
        const numCollabReq = Array.from(ens)[numRandom];
        ens.delete(numCollabReq);
        const json = JSON.stringify({ message: 2, numEnvoi: num, numDest: numCollabReq, numCible: numCollab, set: JSON.stringify(Array.from(set)), piggyback: JSON.stringify(Array.from(toPG)) });
        socket.send(json);
        log("Sent : ping-req (" + num + "->" + numCollabReq + "->" + numCollab + ')');

        i--;
      }

      clearTimeout();
      setTimeout(function(){
        if(reponse){
          //PG[numCollab] = {message: 2, incarn: incarnActu, cpt:K}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
          collaborateurs.set(numCollab,"Alive");
          //log("réponse au ping-req (Collaborateur OK)");
        }else{
          if(collaborateurs.get(numCollab)==='Alive'){
            PG.set(numCollab,{message:3, incarn: incarnActu, cpt:K});
            collaborateurs.set(numCollab,"Suspect");
            log("Collaborateur suspect");
          }else if(collaborateurs.get(numCollab)==='Suspect'){
            PG.set(numCollab,{message:4, incarn: incarnActu, cpt:K});
            collaborateurs.delete(numCollab);
            log("Collaborateur mort");
          }else{
            log('SmallError: collaborateur déjà mort')
          }
          actualCollaborateurs();
        }
      }, 3*coef)
    }else{
      //PG[numCollab] = {message: 2, incarn: incarnActu, cpt:K}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
      log("réponse au ping (collaborateur OK)");
    }
  }, coef)
}

//Gossiping

setInterval(function() {
  if(collaborateurs.size>1&&collaborateurs.has(num)){
    const ens : Set<number> = new Set(collaborateurs.keys());
    ens.delete(num);
    
    const numRandom = Math.floor(Math.random()*ens.size);
    const numCollab = Array.from(ens)[numRandom];

    log('DEBUG: ping aléatoire sur : ' + numCollab);
    pingProcedure(numCollab);

  }
},10*coef);