import { Subject } from 'rxjs';
import { app, num } from './app';
import { log } from './ui';

const socket = new WebSocket('ws://localhost:8081/');

export const bloques : Set<number> = new Set();

socket.onopen = function() {
    const json = JSON.stringify({ message: 'Hello', numEnvoi: 0, numDest: 0});
    sockhttp://localhost:8080/send(json);
    log.next("Connection établie");
}

socket.onerror = function(event) {
    app.error(event);
}

socket.onmessage = function (event) {
    if(event.data.numEnvoi!==num&&(event.data.numDest===num||event.data.numDest===0)){
        if(bloques.has(event.data.numEnvoi)){
            app.next(event.data);
        }else{
            log.next("Message bloqué (collaborateur " + event.data.numEnvoi + ")");
        }       
    }
}

socket.onclose = function() {
    app.complete();
} 

const gererBlocage = function(num){
    if(bloques.has(num)){
        bloques.delete(num);
    }else{
        bloques.add(num);
    }
    //DEBUG actualiser affichage
}

export const mess = new Subject();
const obsMess = mess.asObservable();
obsMess.subscribe(socket.send);

export const bloq = new Subject();
const obsBloq = bloq.asObservable();
obsBloq.subscribe(gererBlocage);
//DEBUG Transmettre les messages au serveur : socket.send(json);
//DEBUG Gestion des blocages