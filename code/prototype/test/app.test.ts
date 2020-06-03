import { app } from "../public/app";
import { message } from '../public/interface';
import test from "ava";
import { Subject } from 'rxjs';

test("init",(t)=>{
    t.plan(1);

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => t.deepEqual(x,{type:"numUpdate",contenu:undefined}),
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({ type: 'repServ', contenu: 1});
    
    //TESTS A FAIRE
})

test("receptionPing",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            if(cpt===0){
                t.deepEqual(x,{type:"numUpdate",contenu:undefined})   
            }else{
                const ACK = JSON.stringify({ message: 3, numEnvoi: 1, numDest : 2, users: undefined, set: undefined, piggyback: undefined});
                t.deepEqual(x,{type:"message",contenu:ACK})   
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({ type: 'repServ', contenu: 1}); //initialisation du collaborateur
    const ping = JSON.stringify({ message: 1, numEnvoi: 2, numDest : 1, users: undefined, set: undefined, piggyback: undefined}); //On crée un ping en direction du colalborateur
    subIn.next({type:"message",contenu:ping});
})

test("receptionPingReq_SansReponse",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            if(cpt===0){
                t.deepEqual(x,{type:"numUpdate",contenu:undefined})   
            }else{
                const pignReqRep = JSON.stringify({ message: 6, reponse: false, numEnvoi: 1, numDest: 2, set: undefined, piggyback: undefined});
                t.deepEqual(x,{type:"message",contenu:pignReqRep})   
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({ type: 'repServ', contenu: 1}); //initialisation du collaborateur
    //Editer la liste des collabs manuellement
    const pingReq = JSON.stringify({ message: 2, numEnvoi: 2, numDest: 1, numCible: 3, set: undefined, piggyback: undefined });
    subIn.next({type:"message",contenu:pingReq});
          
})