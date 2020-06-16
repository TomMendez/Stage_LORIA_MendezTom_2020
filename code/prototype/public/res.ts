import { Subject, Observable } from 'rxjs';
import * as i from './interface.js';

export class res {
    
    private subjApp : Subject<i.Interne>
    private subjUI : Subject<i.Interne>

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
            vres.subjUI.next({type:i.TYPE_LOG_LABEL, contenu:"Connexion établie"});
        }
    
        this.socket.onerror = function(event) {
            vres.subjApp.error(event); //DEBUG : sûrement à changer
        }
    
        this.socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if((vres.num===0)||(data.numEnvoi!==vres.num&&(data.numDest===vres.num||data.numDest===0))){
                if(!bloques.has(data.numEnvoi)){
                    vres.subjApp.next({type:i.TYPE_MESSAGE_LABEL, contenu:data});
                }else{
                    vres.subjUI.next({type:i.TYPE_LOG_LABEL,contenu: "Message bloqué (collaborateur " + data.numEnvoi + ")"});
                }       
            }
        }
    
        this.socket.onclose = function() {
            vres.socket.close();
            vres.subjApp.next({type:i.TYPE_STOP_LABEL});
            vres.subjUI.next({type:i.TYPE_STOP_LABEL});
        } 
    }

    getObsApp(){
        return this.subjApp.asObservable();
    }
    
    getObsUI(){
        return this.subjUI.asObservable();
    }
    
    setObsIn(obs : Observable<i.Interne>){
        obs.subscribe((data) => {
            this.dispatcher(data)
          }); //On stocke potentiellement la souscription DEBUG
    }
    
    dispatcher(data : i.Interne){ //DEBUG gestion des erreurs?
        if(data.type===i.TYPE_MESSAGE_LABEL){
            this.socket.send(JSON.stringify(data.contenu))
        }else if (data.type===i.TYPE_BLOCAGE_LABEL){
            this.gererBlocage(data.contenu);
        }else if(data.type===i.TYPE_NUMUPDATE_LABEL){ //DEBUG Il y a peut-être plus simple que cette solution
            this.num=data.contenu;
        }else if (data.type===i.TYPE_STOP_LABEL){
            this.socket.close();
        }else{
            this.subjUI.next({type:i.TYPE_LOG_LABEL, contenu:"ERREUR: type inconnu dans le dispatcher res"})
        }
    }

    gererBlocage(num : number){
        if(this.bloques.has(num)){
            this.bloques.delete(num);
        }else{
            this.bloques.add(num);
        }
        this.subjUI.next({type:i.TYPE_ACTUBLOQUES_LABEL, contenu:this.bloques});
        this.subjApp.next({type:i.TYPE_UPDATEUI_LABEL});
    }
}