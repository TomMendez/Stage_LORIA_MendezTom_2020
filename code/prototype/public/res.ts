import { Subject, Observable } from 'rxjs';
import { message } from './interface.js';

export class res {
    
    private subjApp : Subject<message>
    private subjUI : Subject<message>

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
            vres.subjUI.next({type:"log", contenu:"Connexion établie"});
        }
    
        this.socket.onerror = function(event) {
            vres.subjApp.error(event); //DEBUG : sûrement à changer
        }
    
        this.socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if((vres.num===0)||(data.numEnvoi!==vres.num&&(data.numDest===vres.num||data.numDest===0))){
                if(!bloques.has(data.numEnvoi)){
                    vres.subjApp.next({type:"message", contenu:data});
                }else{
                    vres.subjUI.next({type:"log",contenu: "Message bloqué (collaborateur " + data.numEnvoi + ")"});
                }       
            }
        }
    
        this.socket.onclose = function() {
            vres.socket.close();
            vres.subjApp.next({type:"stop", contenu:undefined});
            vres.subjUI.next({type:"stop", contenu:undefined});
        } 
    }

    getObsApp(){
        return this.subjApp.asObservable();
    }
    
    getObsUI(){
        return this.subjUI.asObservable();
    }
    
    setObsIn(obs : Observable<message>){
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
            this.subjApp.next({type:"stop", contenu:undefined});
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
        this.subjApp.next({type:"updateUI",contenu:undefined});
    }
}