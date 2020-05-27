import { Subject, Observable } from 'rxjs';
import { message } from './interface.js';

export class res {
    
    private subjApp : Subject<any>
    private subjUI : Subject<any>

    private socket : WebSocket;
    private bloques : Set<number>;
    private num : number;

    constructor(){
        this.subjApp = new Subject();
        this.subjUI = new Subject();

        this.bloques = new Set();
        const bloques = this.bloques;
        this.num=0;
        const res = this;

        this.socket = new WebSocket('ws://localhost:8081/'); 

        this.socket.onopen = function() {
            const json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
            sockhttp://localhost:8080/send(json);
            res.subjUI.next({type:"log", contenu:"Connection établie"});
        }
    
        this.socket.onerror = function(event) {
            res.subjApp.error(event); //DEBUG : sûrement à changer
        }
    
        this.socket.onmessage = function (event) {
            //DEBUG NE MARCHE PAS A CORRIGER EN PRIORITE
            const data = JSON.parse(event.data);
            if((res.num===0)||(data.numEnvoi!==res.num&&(data.numDest===res.num||data.numDest===0))){
                if(!bloques.has(data.numEnvoi)){
                    res.subjApp.next({type:"message", contenu:data});
                }else{
                    res.subjUI.next({type:"log",contenu: "Message bloqué (collaborateur " + data.numEnvoi + ")"});
                }       
            }
        }
    
        this.socket.onclose = function() {
            res.subjApp.complete();
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
        }else if (data.type==="stop"){
            this.socket.close();
        }else{
            this.subjUI.next({type:"log", contenu:"ERREUR: type inconnu dans le dispatcher res: " + data.type})
        }
    }

    gererBlocage(num : number){
        if(this.bloques.has(num)){
            this.bloques.delete(num);
        }else{
            this.bloques.add(num);
        }
        this.subjUI.next({type:"bloquesUpdate",contenu:this.bloques});
        this.subjUI.next({type:"updateUI",contenu:undefined});
    }
}