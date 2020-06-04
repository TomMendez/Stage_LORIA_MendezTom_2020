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
        x => t.deepEqual(x,{type:"numUpdate",contenu:1}),
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}});
    
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
                t.deepEqual(x,{type:"numUpdate",contenu:1})   
            }else{
                const ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: []};
                t.deepEqual(x,{type:"message",contenu:ACK})   
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}; //On crée un ping en direction du colalborateur
    subIn.next({type:"message",contenu:ping});
})

test("receptionPingReq",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            if(cpt===0){
                t.deepEqual(x,{type:"numUpdate",contenu:1})   
            }else{
                const pingReqRep = { message: 1, numEnvoi: 1, numDest: 3, set: [], users: [[1,"Alive"]], piggyback: []};
                t.deepEqual(x,{type:"message",contenu:pingReqRep})   
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    //Editer la liste des collabs manuellement
    const pingReq = { message: 2, numEnvoi: 2, numDest: 1, numCible: 3, set: [], piggyback: [] };
    subIn.next({type:"message",contenu:pingReq});
          
})

test("joined",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            console.log(x);
            if(cpt===0){
                t.deepEqual(x,{type:"numUpdate",contenu:1})   
            }else{
                const ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
                t.deepEqual(x,{type:"message",contenu:ACK})   
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}]]}; //On crée un ping en direction du colalborateur
    subIn.next({type:"message",contenu:ping});
})


//test suspect et confirm
//test décrémentration compteur pg
//test ne pas rePG une info déjà PG
//test procedurePing complète
//test les liens avec incarnations