import { Subject, Observable } from 'rxjs';
import { coef, K, nbPR } from './const.js';
import { message, messPG } from './interface.js';

export class app{

  private subjUI : Subject<message>;
  private subjRes : Subject<message>;

  public num : number;
  private collaborateurs : Map<number,string>;
  private set : Set<string>;
  
  private PG : Map<number,messPG>; //DEBUG à changer
  private incarnation : number;
  private reponse : boolean;
  private gossip : boolean;

  constructor(){
    this.subjUI = new Subject();
    this.subjRes = new Subject();
    this.num = 0;
    this.collaborateurs= new Map();
    this.set=new Set();
    this.PG=new Map();
    this.incarnation=0;
    this.reponse = true;
    this.gossip = true;
  }

  getObsUI(){
    return this.subjUI.asObservable();
  }

  getObsRes(){
    return this.subjRes.asObservable();
  }

  setObsIn(obs : Observable<message>){
    obs.subscribe((data) => {
      this.dispatcher(data)
    }); //On stocke potentiellement la souscription DEBUG
  }

  dispatcher(data : message){
    if(data.type==="message"){
      this.traiterMessage(data.contenu)
    }else if(data.type==="pingUI"){
      this.pingProcedure(data.contenu)
    }else if(data.type==="ajoutChar"){
      this.ajoutChar(data.contenu);
    }else if(data.type==="updateUI"){
      this.subjUI.next({type:"actuCollab",contenu:this.collaborateurs});
    }else if(data.type==="stop"){
      this.terminer();
    }else{
      this.subjUI.next({type:"log", contenu:"ERREUR: type inconnu dans le dispatcher app: " + data.type})
    }
  }

  traiterMessage(data : any) {
    //log('DEBUG: ' + event.data);
    if(this.num===0){
      //Initialisation du collaborateur
      this.num=data.contenu;
      this.subjRes.next({type:"numUpdate",contenu:this.num}); 
      this.subjUI.next({type:"numUpdate",contenu:this.num});
      this.collaborateurs.set(this.num,"Alive");
      this.subjUI.next({type:"actuCollab",contenu:this.collaborateurs});
      //this.subjUI.next({type:"actuSet",contenu:this.set}); inutile je pense
      this.subjUI.next({type:"log", contenu:'Serveur: Bienvenue ' + this.num});
    }else{
        let messtring="";
        if(data.set!==[]&&data.set!==undefined){
          this.actualDonnees(data.set);
        }
        if(data.piggyback!=[]){
          const piggyback : Map<number,messPG> = new Map(data.piggyback);
          for(const [key,elem] of piggyback){
            let pgstring = "";
               
            //Evaluation des propriété des messages PG
            switch(elem.message){
              case 1: //Joined
                pgstring="Joined";
                if(!this.collaborateurs.has(key)){
                  elem.cpt=K;
                  this.PG.set(key,elem);
                  this.collaborateurs.set(key,"Alive");
                }
                break;
              case 2: //Alive
                pgstring="Alive";
                if(this.collaborateurs.has(key)&&((!this.PG.has(key))||(elem.incarn>this.PG.get(key)!.incarn))){
                  elem.cpt=K;
                  this.PG.set(key,elem);
                  this.collaborateurs.set(key,"Alive");
                }
                break;
              case 3: //Suspect
                pgstring="Suspect";
                if(key===this.num){
                  this.subjUI.next({type:"log", contenu:'DEBUG: démenti généré'});
                  this.incarnation++;
                  this.PG.set(key,{message:2, incarn: this.incarnation, cpt:K});
                }else{
                  if(this.collaborateurs.has(key)){
                    let overide=false;
                    if(this.PG.get(key)===undefined){
                      overide=true;
                    }else if((this.PG.get(key)!.message===3)&&(elem.incarn>this.PG.get(key)!.incarn)){
                      overide=true;
                    }else if((this.PG.get(key)!.message===2)&&(elem.incarn>=this.PG.get(key)!.incarn)){
                      overide=true;
                    }
                    if(overide){
                      elem.cpt=K;
                      this.PG.set(key,elem);
                      this.collaborateurs.set(key,"Suspect");
                    }
                  }
                }
                break;
              case 4: //Confirm
                pgstring="Confirm";
                if(this.collaborateurs.has(key)){
                  if(key===this.num){
                    this.subjUI.next({type:"log", contenu:'!!! You have been declared dead'});
                    this.subjRes.error(0);
                  }
                  elem.cpt=K;
                  this.PG.set(key,elem);
                  this.collaborateurs.delete(key);
                }
                break;
              default:
                if(key===undefined){
                  this.subjUI.next({type:"log", contenu:'Error: Piggybag on undefined'});
                }else{
                  this.subjUI.next({type:"log", contenu:'SmallError: message de PG inconnu'});
                }
            }
            this.subjUI.next({type:"log", contenu:'PG: ' + pgstring + ' ' +  key + ' (' + elem.cpt + ')'});
            this.subjUI.next({type:"actuCollab", contenu:this.collaborateurs});
          }
        }
        const vapp = this;
        switch(data.message){
          case 1: //ping
            messtring="ping";
            this.envoyerMessageDirect(3,data.numEnvoi);
            break;
          case 2: //ping-req
            messtring="ping-req";
            this.envoyerMessageDirect(1,data.numCible)
          
            this.reponse = false;
            setTimeout(function(){ 
              const toPG : Map<number,messPG> = new Map();
              if(vapp.PG!==undefined){
                for(const [key,value] of vapp.PG){
                  if(value.cpt>0){
                    value.cpt--;
                    toPG.set(key,value);
                  }else if(vapp.collaborateurs.get(key)==="Suspect"){
                    toPG.set(key,value);
                  }
                };
              }
              const json = { message: 6, reponse: vapp.reponse, numEnvoi: vapp.num, numDest: data.numEnvoi, set: Array.from(vapp.set), piggyback: Array.from(toPG)};
              vapp.subjRes.next({type:"message",contenu:json});
              vapp.subjUI.next({type:"log", contenu:"Sent : ping-reqRep reponse=" + vapp.reponse + " (" + vapp.num + "->" + data.numEnvoi + ')'});    
            }, coef)
            break;
          case 3: //ack
            messtring="ack";
            this.reponse=true;
            break;
          case 4: //data-request
            messtring="data-request";
            this.collaborateurs.set(data.numEnvoi,"Alive");
            this.subjUI.next({type:"actuCollab",contenu:this.collaborateurs});
            this.envoyerMessageDirect(5,data.numEnvoi)
            this.PG.set(data.numEnvoi,{message:1, incarn: this.incarnation, cpt:K});
            break;
          case 5: //data-update
            if(data.numEnvoi===this.num){
              this.subjUI.next({type:"log", contenu:'auto-réponse!!! DEBUG'}); //DEBUG à remplacer par un assert
            }else{
              messtring="data-update";
              this.collaborateurs=new Map(data.users);
              this.subjUI.next({type:"actuCollab",contenu:this.collaborateurs});
              this.subjUI.next({type:"log", contenu:'Données mises à jour'});
            }
            break;
          case 6: //ack(ping-req) -> DEBUG à supprimer
            messtring="ack(ping-req)"
            if(data.reponse===true){
              this.subjUI.next({type:"log", contenu:"ping-req réussi"});    
              this.reponse=true;
            }else{
              this.subjUI.next({type:"log", contenu:"ping-req échoué"});    
            }
            break;
          default:
            messtring="?";
            this.subjUI.next({type:"log", contenu:'Error: message reçu inconnu'})
        }
        this.subjUI.next({type:"log", contenu:'Received: ' + messtring + ' (' + data.numDest + '<-' + data.numEnvoi + ')'});
    }
  }

  envoyerMessageDirect(numMessage : number, numDest:number){
    const toPG : Map<number,messPG> = new Map();
    if(this.PG!==undefined){
      for(const [key,value] of this.PG){
        if(value.cpt>0){
          value.cpt--;
          toPG.set(key,value);
        }else if(this.collaborateurs.get(key)==="Suspect"){
          toPG.set(key,value);
        }
      };
    }
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
    const json = { message: numMessage, numEnvoi: this.num, numDest : numDest, users: Array.from(this.collaborateurs), set: Array.from(this.set), piggyback: Array.from(toPG)};
    this.subjRes.next({type:"message",contenu:json});
    this.subjUI.next({type:"log", contenu:'Sent: ' + messtring + ' (' + this.num + '->' + numDest + ')'});
  }

  terminer(){
    this.PG.set(this.num,{message:4, incarn: this.incarnation, cpt:K});

    const ens : Set<number> = new Set(this.collaborateurs.keys());
    ens.delete(this.num);
    
    const numRandom = Math.floor(Math.random()*ens.size);
    const numCollab = Array.from(ens)[numRandom];

    this.subjUI.next({type:"log", contenu:'DEBUG: ping aléatoire sur : ' + numCollab});
    this.envoyerMessageDirect(1,numCollab);
    this.subjUI.next({type:"log", contenu:'Closed connection 😱'});

    this.subjUI.next({type:"actuCollab",contenu:this.collaborateurs});
    this.gossip=false;
  }

  actualDonnees(nS:Array<string>){
    const newSet = new Set(nS);
    for(const char of newSet){
      this.set.add(char);
    }
    this.set = new Set(Array.from(this.set).sort());
    this.subjUI.next({type:"actuSet",contenu:this.set});
  }

  ajoutChar(char:string){
    if(char!==''){
      if(this.set.has(char)){
        this.subjUI.next({type:"log", contenu:'SmallError: ' + char + ' already in the set'});
      }else{
        this.set.add(char);
        this.subjUI.next({type:"log", contenu:'Action: ' + char + ' was added to add the set'});
        this.subjUI.next({type:"actuSet",contenu:this.set});
      }
    }else{
      this.subjUI.next({type:"log", contenu:'SmallError: no char to the set'});
    }
  }

  pingProcedure(numCollab:number){
    this.envoyerMessageDirect(1,numCollab);

    this.reponse = false;
    const vapp = this;
    setTimeout(function(){ 
      let incarnActu : number = 0;
      if(vapp.PG.has(numCollab)){
        incarnActu=vapp.PG.get(numCollab)!.incarn;
      }
      if(!vapp.reponse){
        vapp.subjUI.next({type:"log", contenu:"pas de réponse au ping direct"});

        const toPG : Map<number,messPG> = new Map();
        if(vapp.PG!==undefined){
          for(const [key,value] of vapp.PG){
            if(value.cpt>0){
              value.cpt--;
              toPG.set(key,value);
            }else if(vapp.collaborateurs.get(key)==="Suspect"){
              toPG.set(key,value);
            }
          };
        }
        
        let i = nbPR;
        if(i>vapp.collaborateurs.size-1){
          i=vapp.collaborateurs.size-1;
        }
        const ens : Set<number> = new Set(vapp.collaborateurs.keys());
        ens.delete(vapp.num);
        ens.delete(numCollab);

        while(i>0){
          const numRandom = Math.floor(Math.random()*ens.size);
          const numCollabReq = Array.from(ens)[numRandom];
          ens.delete(numCollabReq);
          const json = { message: 2, numEnvoi: vapp.num, numDest: numCollabReq, numCible: numCollab, set: Array.from(vapp.set), piggyback: Array.from(toPG) };
          vapp.subjRes.next({type:"message",contenu:json});
          vapp.subjUI.next({type:"log", contenu:"Sent : ping-req (" + vapp.num + "->" + numCollabReq + "->" + numCollab + ')'});

          i--;
        }

        clearTimeout();
        setTimeout(function(){
          if(vapp.reponse){
            //PG[numCollab] = {message: 2, incarn: incarnActu, cpt:K}; inutile? Si il y a suspect, le numéro d'incarnation sera trop petit
            vapp.collaborateurs.set(numCollab,"Alive");
            vapp.subjUI.next({type:"log", contenu:"réponse au ping-req (Collaborateur OK)"})
          }else{
            if(vapp.collaborateurs.get(numCollab)==='Alive'){
              vapp.PG.set(numCollab,{message:3, incarn: incarnActu, cpt:K});
              vapp.collaborateurs.set(numCollab,"Suspect");
              vapp.subjUI.next({type:"log", contenu:"Collaborateur suspect"});
            }else if(vapp.collaborateurs.get(numCollab)==='Suspect'){
              vapp.PG.set(numCollab,{message:4, incarn: incarnActu, cpt:K});
              vapp.collaborateurs.delete(numCollab);
              vapp.subjUI.next({type:"log", contenu:"Collaborateur mort"});
            }else{
              vapp.subjUI.next({type:"log", contenu:'SmallError: collaborateur déjà mort'})
            }
            vapp.subjUI.next({type:"actuCollab",contenu:vapp.collaborateurs});
          }
        }, 3*coef)
      }else{
        //PG[numCollab] = {message: 2, incarn: incarnActu, cpt:K}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
        vapp.subjUI.next({type:"log", contenu:"réponse au ping (collaborateur OK)"});
      }
    }, coef)
  }

  gossiping(){
    if(this.gossip&&this.collaborateurs.size>1&&this.collaborateurs.has(this.num)){
      const ens : Set<number> = new Set(this.collaborateurs.keys());
      ens.delete(this.num);
      
      const numRandom = Math.floor(Math.random()*ens.size);
      const numCollab = Array.from(ens)[numRandom];

      this.subjUI.next({type:"log", contenu:'DEBUG: ping aléatoire sur : ' + numCollab});
      this.pingProcedure(numCollab);
    } 
  }

}