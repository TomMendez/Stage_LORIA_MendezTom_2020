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
    
    //DEBUG TESTS A FAIRE
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

test("decrementationPG",(t)=>{
    t.plan(7);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            console.log(x);
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})  
                    break; 
                case 2:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:2}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})
                    break;  
                case 3:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:1}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})  
                    break;
                case 4:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:0}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})  
                    break;
                default:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: []};
                    t.deepEqual(x,{type:"message",contenu:ACK}) ; 
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}]]}; //On crée un ping en direction du colalborateur
    for(let i=0;i<6;i++){
        subIn.next({type:"message",contenu:ping}); 
    }
})

test("Suspect & Confirm",(t)=>{
    t.plan(4);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            console.log(x);
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
                case 2:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Suspect"]], piggyback: [[2,{message:3,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK}) 
                    break;
                default:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: [[2,{message:4,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK}) 
                    break;
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    let ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}]]}; //On crée un ping en direction du colalborateur
    subIn.next({type:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:3,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:4,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
})

test("Démenti",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            console.log(x);
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: [[1,{message:2,incarn:1,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[1,{message:3,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
})

//test les liens avec incarnations
//test procedurePing complète

//Améliorer rédaction des tests (rempalcer les premiers if/else par des switchs comme dans les suivants et commenter)
//IMPORTANT DEBUG : j'ai l'impression que l'archtiecture actuelle ferme la conenxion à la socket avant de termner la connexion