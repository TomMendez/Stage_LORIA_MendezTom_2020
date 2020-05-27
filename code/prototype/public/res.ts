import { Subject, Observable } from 'rxjs';
import { message } from './interface.js';

export class res {
    
    private subjApp = new Subject();
    private subjUI = new Subject();

    private socket : WebSocket;
    private bloques : Set<number>;
    private num : number;

    constructor(){
        this.bloques = new Set();
        const bloques = this.bloques;
        this.num=0;
        let num = this.num;

        this.socket = new WebSocket('ws://localhost:8081/'); 
        const subjUI=this.subjUI;
        const subjApp=this.subjApp;

        this.socket.onopen = function() {
            const json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
            sockhttp://localhost:8080/send(json);
            subjUI.next({type:"log", contenu:"Connection établie"});
        }
    
        this.socket.onerror = function(event) {
            subjApp.error(event); //DEBUG : sûrement à changer
        }
    
        this.socket.onmessage = function (event) {
            //DEBUG à vérifier
            if((num===0)||(event.data.numEnvoi!==num&&(event.data.numDest===num||event.data.numDest===0))){
                if(!bloques.has(event.data.numEnvoi)){
                    subjApp.next({type:"message", contenu:event.data});
                }else{
                    subjUI.next({type:"log",contenu: "Message bloqué (collaborateur " + event.data.numEnvoi + ")"});
                }       
            }
        }
    
        this.socket.onclose = function() {
            subjApp.complete();
        } 
    }

    getObsApp(){
        return this.subjApp.asObservable();
    }
    
    getObsUI(){
        return this.subjUI.asObservable();
    }
    
    setObsIn(obs : Observable<any>){
        obs.subscribe((data) => {
            this.dispatcher(data)
          }); //On stocke potentiellement la souscription DEBUG
    }
    
    dispatcher(data : message){ //DEBUG gestion des erreurs?
        if(data.type==="message"){
            this.socket.send(data.contenu)
        }else if (data.type==="bloquage"){
            this.gererBlocage(data.contenu);
        }else if(data.type==="numUpdate"){ //DEBUG Il y a peut-être plus simple que cette solution
            this.num=data.contenu;
        }else{
            this.subjUI.next({type:"log", contenu:"ERREUR: type inconnu dans le dispatcher res"})
        }
    }

    gererBlocage(num : number){
        if(this.bloques.has(num)){
            this.bloques.delete(num);
        }else{
            this.bloques.add(num);
        }
        this.subjUI.next({type:"bloquesUpdate",contenu:JSON.stringify(Array.from(this.bloques))});
        this.subjUI.next({type:"updateUI",contenu:undefined});
    }
}