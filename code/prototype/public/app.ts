import { Subject } from 'rxjs';
import { log, actuCollab, actuSet} from './ui';
import { mess } from './res';
  
//paramètres de la simulation
const coef = 200; //coefficient appliqué à tous les délais (timeouts / fréquence de ping aléatoires)
const K = 4; //K est le nombre de personnes à qui ont transmet les messages de PG
const nbPR = 2; //nbPR est le nombre de client qui reçoivent un ping-req dans la pingProcedure (ou moins si il n'y pas assez de clients)

interface messPG {
  message: number;
  incarn: number;
  cpt: number;
}

  export let num = 0;
  let collaborateurs : Map<number,string> = new Map();
  let set : Set<string> = new Set();
  
  //Variables de ce replica
  const PG : Map<number,messPG> = new Map(); //DEBUG à changer
  let incarnation = 0;
  let reponse = true;

  const traiterMessage = function (data) {
    //log('DEBUG: ' + event.data);
    if(num===0){
      //Initialisation du collaborateur
      num=data.num; 
      $(`<h1 style="text-align: center">Collaborateur ` + num + `</h1>`).appendTo($("#titre"));
      collaborateurs.set(num,"Alive");
      actuCollab.next(collaborateurs);
      actuSet.next(set);
      log.next('Serveur: Bienvenue ' + num);
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
                  log.next('DEBUG: démenti généré');
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
                    log.next('!!! You have been declared dead');
                    mess.complete();
                  }
                  elem.cpt=K;
                  PG.set(key,elem);
                  collaborateurs.delete(key);
                }
                break;
              default:
                if(key===undefined){
                  log.next('Error: Piggybag on undefined');
                }else{
                  log.next('SmallError: message de PG inconnu');
                }
            }
            log.next('PG: ' + pgstring + ' ' +  key + ' (' + elem.cpt + ')');
            actuCollab.next(collaborateurs);
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
              mess.next(json);
              log.next("Sent : ping-reqRep reponse=" + reponse + " (" + num + "->" + data.numEnvoi + ')');    
            }, coef)
            break;
          case 3: //ack
            messtring="ack";
            reponse=true;
            break;
          case 4: //data-request
            messtring="data-request";
            collaborateurs.set(data.numEnvoi,"Alive");
            actuCollab.next(collaborateurs);
            envoyerMessageDirect(5,data.numEnvoi)
            PG.set(data.numEnvoi,{message:1, incarn: incarnation, cpt:K});
            break;
          case 5: //data-update
            messtring="data-update";
            collaborateurs=new Map(JSON.parse(data.users));
            actuCollab.next(collaborateurs);
            log.next('Données mises à jour');
            break;
          case 6: //ack(ping-req) -> DEBUG à supprimer
            messtring="ack(ping-req)"
            if(data.reponse===true){
              log.next("ping-req réussi");    
              reponse=true;
            }else{
              log.next("ping-req échoué");    
            }
            break;
          default:
            messtring="?";
            log.next('Error: message reçu inconnu')
        }
        //log.next('Received: ' + messtring + ' (' + data.numDest + '<-' + data.numEnvoi + ')');
      }
    }
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
    mess.next(json);
    //log('Sent: ' + messtring + ' (' + num + '->' + numDest + ')');
  }

  const actualDonnees = function(nS:Array<string>){
    const newSet = new Set(nS);
    for(const char of newSet){
      set.add(char);
    }
    set = new Set(Array.from(set).sort());
    actuSet.next(set);
  }


//Gossiping

const pingProcedure = function(numCollab:number){
  envoyerMessageDirect(1,numCollab);

  reponse = false;
  setTimeout(function(){ 
    let incarnActu : number = 0;
    if(PG.has(numCollab)){
      incarnActu=PG.get(numCollab)!.incarn;
    }
    if(!reponse){
      log.next("pas de réponse au ping direct");

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
        mess.next(json);
        log.next("Sent : ping-req (" + num + "->" + numCollabReq + "->" + numCollab + ')');

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
            log.next("Collaborateur suspect");
          }else if(collaborateurs.get(numCollab)==='Suspect'){
            PG.set(numCollab,{message:4, incarn: incarnActu, cpt:K});
            collaborateurs.delete(numCollab);
            log.next("Collaborateur mort");
          }else{
            log.next('SmallError: collaborateur déjà mort')
          }
          actuCollab.next(collaborateurs);
        }
      }, 3*coef)
    }else{
      //PG[numCollab] = {message: 2, incarn: incarnActu, cpt:K}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
      log.next("réponse au ping (collaborateur OK)");
    }
  }, coef)
}

setInterval(function() {
  if(collaborateurs.size>1&&collaborateurs.has(num)){
    const ens : Set<number> = new Set(collaborateurs.keys());
    ens.delete(num);
    
    const numRandom = Math.floor(Math.random()*ens.size);
    const numCollab = Array.from(ens)[numRandom];

    log.next('DEBUG: ping aléatoire sur : ' + numCollab);
    pingProcedure(numCollab);

  }
},10*coef);

export const app = new Subject();
const obsApp = app.asObservable();
obsApp.subscribe(traiterMessage);