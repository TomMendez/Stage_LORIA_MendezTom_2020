import { Subject, Observable } from 'rxjs';
import { coef, nbPR } from './const.js';
import * as i from './interface.js';

export class app{

  private subjUI : Subject<i.message>;
  private subjRes : Subject<i.message>;

  public num : number;
  private set : Set<string>;
  
  private collaborateurs : number[];
  private PG : Map<number,i.messPG>;
  private compteurPG : Map<number,number>;
  private incarnation : number;
  private reponse : boolean;
  private gossip : boolean;

  constructor(){
    this.subjUI = new Subject();
    this.subjRes = new Subject();
    this.num = 0;
    this.set=new Set();
    this.collaborateurs=[];
    this.PG=new Map();
    this.compteurPG=new Map();
    this.incarnation=0;
    this.reponse = true;
    this.gossip = true;
  }

  //Getter uniquement pour les tests
  getNum(){
    return this.num;
  }

  getCollaborateurs(){
    return this.collaborateurs;
  }

  getPG(){
    return this.PG;
  }

  getCompteurPG(){
    return this.compteurPG
  }

  calculNbRebond(){
    return Math.ceil(3*Math.log2(this.collaborateurs.length+1));
  }

  getObsUI(){
    return this.subjUI.asObservable();
  }

  getObsRes(){
    return this.subjRes.asObservable();
  }

  setObsIn(obs : Observable<i.message>){
    obs.subscribe((data) => {
      this.dispatcher(data)
    }); //On stocke potentiellement la souscription DEBUG
  }

  dispatcher(data : i.message){
    if(data.typeM==="message"){
      this.traiterMessage(data.contenu)
    }else if(data.typeM==="pingUI"){
      this.pingProcedure(data.contenu)
    }else if(data.typeM==="ajoutChar"){
      this.ajoutChar(data.contenu);
    }else if(data.typeM==="updateUI"){
      this.actualcollaborateur();
    }else if(data.typeM==="stop"){
      this.terminer();
      this.subjRes.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"stop",contenu:undefined});
    }else{
      this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"ERREUR: type inconnu dans le dispatcher app: " + data.typeM})
    }
  }

  traiterMessage(data : any) {
    //console.log(data);
    let K : number = this.calculNbRebond();
    if(this.num===0&&data.type===i.TYPE_MESREPSERV_LABEL){
      //Initialisation du collaborateur
      this.num=data.contenu;

      this.collaborateurs.push(this.num)
      this.PG.set(this.num,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0});
      this.compteurPG.set(this.num,0);

      this.subjRes.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:this.num}); 
      this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:this.num});

      this.actualcollaborateur();
      this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Serveur: Bienvenue ' + this.num});
    }else{
      if(data.type===i.TYPE_MESREPSERV_LABEL){
        console.log("repServ buggée"); //A REMPLACER PAR UN ASSERT DEBUG
      }
        let messtring="";
        if(data.set!==[]&&data.set!==undefined){
          this.actualDonnees(data.set);
        }
        if(data.piggyback!=[]){
          const piggyback : Map<number,i.messPG> = new Map(data.piggyback);
          for(const [key,elem] of piggyback){
            let pgstring = "";
               
            //Evaluation des propriété des messages PG
            switch(elem.message){
              case 1: //Joined
                pgstring="Joined";
                if(!this.collaborateurs.includes(key)){
                  this.collaborateurs.push(key)
                  this.PG.set(key,elem);
                  this.compteurPG.set(key,K);
                }
                break;
              case 2: //Alive
                pgstring="Alive";
                if((this.PG.has(key))&&(elem.incarn>this.PG.get(key)!.incarn)){
                  this.PG.set(key,elem);
                  this.compteurPG.set(key,K);
                }
                break;
              case 3: //Suspect
                pgstring="Suspect";
                if(key===this.num){
                  this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'DEBUG: démenti généré'});
                  this.incarnation++;
                  this.PG.set(this.num,{type:i.TYPE_MESPG_LABEL, message:2, incarn: this.incarnation});
                  this.compteurPG.set(this.num,K);
                }else{
                  if(this.collaborateurs.includes(key)){
                    let overide=false;
                    if(this.PG.get(key)===undefined){
                      overide=true;
                    }else if((this.PG.get(key)!.message===3)&&(elem.incarn>this.PG.get(key)!.incarn)){
                      overide=true;
                    }else if(((this.PG.get(key)!.message===1)||(this.PG.get(key)!.message===2))&&(elem.incarn>=this.PG.get(key)!.incarn)){
                      overide=true;
                    }
                    if(overide){
                      this.PG.set(key,elem);
                      this.compteurPG.set(key,K);
                    }
                  }
                }
                break;
              case 4: //Confirm
                pgstring="Confirm";
                if(this.collaborateurs.includes(key)){
                  if(key===this.num){
                    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'!!! You have been declared dead'});
                    this.subjRes.error(0); //DEBUG vérifier que l'erreur est gérée
                  }
                  this.collaborateurs.splice(this.collaborateurs.indexOf(key),1);
                  this.PG.set(key,elem);
                  this.compteurPG.set(key,K);
                }
                break;
              default:
                if(key===undefined){
                  this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Error: Piggybag on undefined'});
                }else{
                  this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'SmallError: message de PG inconnu'});
                }
            }
            this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'PG: ' + pgstring + ' ' +  key});
            this.actualcollaborateur();
          }
        }
        switch(data.message){
          case 1: //ping
            messtring="ping";
            this.envoyerMessageDirect(3,data.numEnvoi);
            break;
          case 2: //ping-req
            messtring="ping-req";
            this.envoyerMessageDirect(1,data.numCible)
            
            this.reponse = false;
            const vapp=this;
            setTimeout(function(){ 
              vapp.envoyerReponsePingReq(data.numEnvoi,vapp.reponse)  ;
            }, coef)
            break;
          case 3: //ack
            messtring="ack";
            this.reponse=true;
            break;
          case 4: //data-request
            messtring="data-request";
            this.collaborateurs.push(data.numEnvoi);
            this.PG.set(data.numEnvoi,{type:i.TYPE_MESPG_LABEL, message:1, incarn: this.incarnation});
            this.compteurPG.set(data.numEnvoi,K)
            this.actualcollaborateur();
            this.envoyerDataUpdate(data.numEnvoi)
            break;
          case 5: //data-update
            if(data.numEnvoi===this.num){
              this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'auto-réponse!!! DEBUG'}); //DEBUG à remplacer par un assert
            }else{
              messtring="data-update";
              this.collaborateurs=data.collaborateurs;
              this.PG=new Map(data.PG);
              this.compteurPG=new Map(data.compteurPG);
              this.actualcollaborateur();
              this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Données mises à jour'});
            }
            break;
          case 6: //ack(ping-req) -> DEBUG à supprimer
            messtring="ack(ping-req)"
            if(data.reponse===true){
              this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"ping-req réussi"});    
              this.reponse=true;
            }else{
              this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"ping-req échoué"});    
            }
            break;
          default:
            messtring="?";
            this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Error: message reçu inconnu: ' + data.message})
        }
        this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Received: ' + messtring + ' (' + data.numDest + '<-' + data.numEnvoi + ')'});
    }
  }

  envoyerMessageDirect(numMessage : number, numDest:number){
    const toPG : Map<number,i.messPG> = this.createToPG();
    let messtring="";
    switch(numMessage){
      case 1:
        messtring="ping";
        break;
      case 3:
        messtring="ack";
        break;
      default:
        messtring="dm inconnu (" + String(numMessage) + ")";
    }
  
    const json = { type: i.TYPE_MESSIMPLE_LABEL, message: numMessage, numEnvoi: this.num, numDest : numDest, set: Array.from(this.set), piggyback: Array.from(toPG)};
    this.subjRes.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:json});
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Sent: ' + messtring + ' (' + this.num + '->' + numDest + ')'});
  }

  envoyerDataUpdate(numDest:number){
    const toPG : Map<number,i.messPG> = this.createToPG();
    const json = { type: i.TYPE_MESDATAUPDATE_LABEL, message: 5, numEnvoi: this.num, numDest : numDest, collaborateurs: this.collaborateurs, PG: Array.from(this.PG), compteurPG: Array.from(this.compteurPG), set: Array.from(this.set), piggyback: Array.from(toPG)};
    this.subjRes.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:json});
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Sent: data-update (' + this.num + '->' + numDest + ')'});
  }

  envoyerPingReq(numDest:number, numCible:number){
    const toPG : Map<number,i.messPG> = this.createToPG();
    const json = { type: i.TYPE_MESPINGREQ_LABEL, message: 2, numEnvoi: this.num, numDest : numDest, numCible : numCible, set: Array.from(this.set), piggyback: Array.from(toPG)};
    this.subjRes.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:json});
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Sent: ping-req (' + this.num + '->' + numDest + '->' + numCible + ')'});
  }

  envoyerReponsePingReq(numDest:number, reponse:boolean){
    const toPG : Map<number,i.messPG> = this.createToPG();
    const json = { type: i.TYPE_MESPINGREQREP_LABEL, message: 6, numEnvoi: this.num, numDest : numDest, reponse: reponse, set: Array.from(this.set), piggyback: Array.from(toPG)};
    this.subjRes.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"message",contenu:json});
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"log", contenu:'Sent: ping-reqRep (' + this.num + '->' + numDest + '(reponse=' + reponse + '))'});
  }

  terminer(){
    let K : number = this.calculNbRebond();
    this.PG.set(this.num,{type:i.TYPE_MESPG_LABEL, message:4, incarn: this.incarnation});
    this.compteurPG.set(this.num,K);

    const ens : Set<number> = new Set(this.collaborateurs);
    ens.delete(this.num);
    
    const numRandom = Math.floor(Math.random()*ens.size);
    const numCollab = Array.from(ens)[numRandom];

    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'DEBUG: ping aléatoire sur : ' + numCollab});
    this.envoyerMessageDirect(1,numCollab);
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'Closed connection 😱'});

    this.actualcollaborateur();
    this.gossip=false;
  }

  actualcollaborateur(){
    let collabs : Map<number,string> = new Map<number,string>();
    this.collaborateurs.sort().forEach((x)=>{
      let str="";
      switch(this.PG.get(x)!.message){
        case 1:
        case 2:
          str="Alive";
          break;
        case 3:
          str="Suspect"
          break;
        default:
          str="???"
      }
      collabs.set(x,str)
    })
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"actuCollab",contenu:collabs});
  }

  createToPG(){
    const toPG : Map<number,i.messPG> = new Map<number,i.messPG>();
    if(this.compteurPG!==undefined){
      for(const [key,value] of this.PG){
        if(this.compteurPG.get(key)!>0){
          this.compteurPG.set(key,this.compteurPG.get(key)!-1);
          toPG.set(key,value);
        }else if(this.PG.get(key)!.message===3){
          toPG.set(key,value);
        }else{
          this.compteurPG.delete(key);
        }
      };
    }
    return toPG;
  }

  actualDonnees(nS:Array<string>){
    const newSet = new Set(nS);
    for(const char of newSet){
      this.set.add(char);
    }
    this.set = new Set(Array.from(this.set).sort());
    this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"actuSet",contenu:this.set});
  }

  ajoutChar(char:string){
    if(char!==''){
      if(this.set.has(char)){
        this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"log", contenu:'SmallError: ' + char + ' already in the set'});
      }else{
        this.set.add(char);
        this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"log", contenu:'Action: ' + char + ' was added to add the set'});
        this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"actuSet",contenu:this.set});
      }
    }else{
      this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"log", contenu:'SmallError: no char to the set'});
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
        vapp.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"log", contenu:"pas de réponse au ping direct"});
        
        let idx = nbPR;
        if(idx>vapp.collaborateurs.length-2){
          idx=vapp.collaborateurs.length-2;
        }
        const ens : Set<number> = new Set(vapp.collaborateurs);
        ens.delete(vapp.num);
        ens.delete(numCollab);

        while(idx>0){
          const numRandom = Math.floor(Math.random()*ens.size);
          const numCollabReq = Array.from(ens)[numRandom];
          ens.delete(numCollabReq);
          vapp.envoyerPingReq(numCollabReq,numCollab);

          idx--;
        }

        clearTimeout();
        setTimeout(function(){
          let K : number = vapp.calculNbRebond();
          if(vapp.reponse){
            vapp.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"réponse au ping-req (Collaborateur OK)"})
          }else{
            if(vapp.collaborateurs.includes(numCollab)){
              if(vapp.PG.get(numCollab)!.message===1||vapp.PG.get(numCollab)!.message===2){
                vapp.PG.set(numCollab,{type:i.TYPE_MESPG_LABEL, message:3, incarn: incarnActu});
                vapp.compteurPG.set(numCollab,K);
                vapp.subjUI.next({type:i.TYPE_MESINTERNE_LABEL,typeM:"log", contenu:"Collaborateur suspect"});
              }else if(vapp.PG.get(numCollab)!.message===3){
                vapp.PG.set(numCollab,{type:i.TYPE_MESPG_LABEL, message:4, incarn: incarnActu});
                vapp.compteurPG.set(numCollab,K);
                vapp.collaborateurs.splice(vapp.collaborateurs.indexOf(numCollab),1);
                vapp.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"Collaborateur mort"});
              }
            }else{
              vapp.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'SmallError: collaborateur déjà mort'})
            }
            vapp.actualcollaborateur();
          }
        }, 3*coef)
      }else{
        //PG[numCollab] = {message: 2, incarn: incarnActu, cpt:K}; inutile? Si il y a suspect, le numéro d'icnarnation sera trop petit
        vapp.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"réponse au ping (collaborateur OK)"});
      }
    }, coef)
  }

  gossiping(){
    if(this.gossip&&this.collaborateurs.length>1&&this.collaborateurs.includes(this.num)){
      const ens : Set<number> = new Set(this.collaborateurs);
      ens.delete(this.num);
      
      const numRandom = Math.floor(Math.random()*ens.size);
      const numCollab = Array.from(ens)[numRandom];

      this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:'DEBUG: ping aléatoire sur : ' + numCollab});
      this.pingProcedure(numCollab);
    } 
  }

}