import { Subject, Observable } from 'rxjs';
import * as i from './interface.js';

export class res {
    
    private subjApp : Subject<i.message>
    private subjUI : Subject<i.message>

    private socket : WebSocket;
    private bloques : Set<number>;
    private num : number;

    constructor(){
        this.subjApp = new Subject();
        this.subjUI = new Subject();

        this.bloques = new Set();
        const bloques = this.bloques;
        this.num=0;
        const vres = this;

        this.socket = new WebSocket('ws://localhost:8081/'); 

        this.socket.onopen = function() {
            // @ts-ignore
            const json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
            sockhttp://localhost:8080/send(json);
            vres.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"Connexion établie"});
        }
    
        this.socket.onerror = function(event) {
            vres.subjApp.error(event); //DEBUG : sûrement à changer
        }
    
        this.socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if((vres.num===0)||(data.numEnvoi!==vres.num&&(data.numDest===vres.num||data.numDest===0))){
                if(!bloques.has(data.numEnvoi)){
                    vres.subjApp.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message", contenu:data});
                }else{
                    vres.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log",contenu: "Message bloqué (collaborateur " + data.numEnvoi + ")"});
                }       
            }
        }
    
        this.socket.onclose = function() {
            vres.socket.close();
            vres.subjApp.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"stop", contenu:undefined});
            vres.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"stop", contenu:undefined});
        } 
    }

    getObsApp(){
        return this.subjApp.asObservable();
    }
    
    getObsUI(){
        return this.subjUI.asObservable();
    }
    
    setObsIn(obs : Observable<i.message>){
        obs.subscribe((data) => {
            this.dispatcher(data)
          }); //On stocke potentiellement la souscription DEBUG
    }
    
    dispatcher(data : i.message){ //DEBUG gestion des erreurs?
        if(data.typeM==="message"){
            this.socket.send(JSON.stringify(data.contenu))
        }else if (data.typeM==="bloquage"){
            this.gererBlocage(data.contenu);
        }else if(data.typeM==="numUpdate"){ //DEBUG Il y a peut-être plus simple que cette solution
            this.num=data.contenu;
        }else if (data.typeM==="stop"){
            this.socket.close();
        }else{
            this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"log", contenu:"ERREUR: type inconnu dans le dispatcher res: " + data.typeM})
        }
    }

    gererBlocage(num : number){
        if(this.bloques.has(num)){
            this.bloques.delete(num);
        }else{
            this.bloques.add(num);
        }
        this.subjUI.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"bloquesUpdate",contenu:this.bloques});
        this.subjApp.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"updateUI",contenu:undefined});
    }
}