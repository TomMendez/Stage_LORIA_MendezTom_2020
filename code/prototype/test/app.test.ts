import { app } from "../public/app";
import * as i from '../public/interface.js';
import test from "ava";
import { Subject } from 'rxjs';

test("init",(t)=>{
    t.plan(5);

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => {
            t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1});
            t.deepEqual(appli.getNum(),1);
            t.deepEqual(appli.getCollaborateurs(),[1]);
            t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]]);
            t.deepEqual(Array.from(appli.getCompteurPG()),[[1,0]]);

        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );
    
    //on envoie au client le message qu'il devrait reçevoir du serveur pour qu'il obtiennent son num
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
})

test("receptionPing",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    const ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: []}; //On vérifie que c'est bien un ACK qui est renvoyé par le client
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK});
                    break; 
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}; //On crée un ping classique en direction du collaborateur
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
})

test("receptionPingReq",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    const pingReqRep = { type: i.TYPE_MESSIMPLE_LABEL, message: 1, numEnvoi: 1, numDest: 3, set: [], piggyback: []}; //On vérifie que c'est bien un ping vers numCible qui est créé par le client
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:pingReqRep})  
                    break; 
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    const pingReq = { message: 2, numEnvoi: 2, numDest: 1, numCible: 3, set: [], piggyback: [] }; //On crée un ping-req classique en direction du collaborateur
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:pingReq});
          
})

test("joined",(t)=>{
    t.plan(3);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    //On vérifie que le client a bien ajouté 2 à sa liste et qu'il commence lui aussi à transmettre l'information
                    const ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2]);
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}]]}; //On envoie un message avec l'information Joined 2 en PG
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
})

test("decrementationPG",(t)=>{
    t.plan(19);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})  
                    t.deepEqual(appli.getCollaborateurs(),[1,2]);
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]]);
                    t.deepEqual(Array.from(appli.getCompteurPG()),[[2,2]]);
                    break; 
                case 2:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]]);
                    t.deepEqual(Array.from(appli.getCompteurPG()),[[2,1]]);
                    break;  
                case 3:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL,message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})  
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]]);
                    t.deepEqual(Array.from(appli.getCompteurPG()),[[2,0]]);
                    break;
                case 4:
                case 5:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: []};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK}); 
                    t.deepEqual(appli.getCollaborateurs(),[1,2]);
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]]);
                    t.deepEqual(Array.from(appli.getCompteurPG()),[]);
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    const ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}]]}; //On crée un ping en direction du collaborateur avec une nouvelle info en PG
    for(let idx=0;idx<5;idx++){
        //On renvoie ensuiet des messages pour suivre la décrémentation du compteurPG en vérifiant que l'info reste bien même quand le compteur est dépassé
        subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping}); 
    }
})

test("Suspect & Confirm",(t)=>{
    t.plan(9);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    //2 doit doit être ajouté
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                case 2:
                    //2 doit doit être suspecté
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:3,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK}) 
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, essage:3,incarn:0}]])
                    break;
                case 3:
                    //2 doit doit être supprimé
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:4,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK}) 
                    t.deepEqual(appli.getCollaborateurs(),[1])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:4,incarn:0}]])
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    let ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}]]}; //on déclare Joined 2
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:3,incarn:0}]]}; //on déclare Suspect 2
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:4,incarn:0}]]}; //on déclare Confirm 2
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
})

test("Démenti",(t)=>{
    t.plan(2);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    //1 doit incrémenter son numéro d'incarnation et répondre Alive 1 (démenti)
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[1,{type:i.TYPE_MESPG_LABEL, message:2,incarn:1}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})   
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    const ping = { type: i.TYPE_MESSIMPLE_LABEL, message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[1,{message:3,incarn:0}]]}; //On déclare Suspect 1 
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
})

test("prioritéPG",(t)=>{
    t.plan(13);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                case 2:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:3,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK}) 
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:3,incarn:0}]])  
                    break;
                case 3:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:3,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})  
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:3,incarn:0}]])  
                    break;
                case 4:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:2,incarn:1}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})   
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:2,incarn:1}]]) 
                    break;
                case 5:
                    ACK = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:4,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ACK})   
                    t.deepEqual(appli.getCollaborateurs(),[1])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:4,incarn:0}]])
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    let ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:3,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:2,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:2,incarn:1}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:4,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:ping});
})

test("pingProcedureOKdirect",(t)=>{
    t.plan(8);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mess;
    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    mess = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                case 2:
                    mess = { type: i.TYPE_MESSIMPLE_LABEL, message: 1, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    break;
                case 3:
                    mess = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    let rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:rep});
    appli.pingProcedure(2);
    rep = { message: 3, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:rep});
    rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:rep});
})

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

test("pingProcedureOKindirect",async t=>{
    t.plan(9);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mess;
    subOut.subscribe(
        x => { 

            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1:
                    mess = { type: i.TYPE_MESSIMPLE_LABEL, message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2,3])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[3,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                case 2:
                    mess = { type: i.TYPE_MESSIMPLE_LABEL, message: 1, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    break;
                case 3:
                    mess = { type: i.TYPE_MESPINGREQ_LABEL, message: 2, numEnvoi: 1, numDest : 3, numCible : 2, set: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess});
                    break;
                case 4:
                    mess = { type: i.TYPE_MESSIMPLE_LABEL,message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: []};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})  
                    t.deepEqual(appli.getCollaborateurs(),[1,2,3])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[3,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]]) 
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    let rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:rep});
    appli.pingProcedure(2);
    await delay(1000)
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:{ message: 6, reponse: true, numEnvoi: 3, numDest: 1, set: [], piggyback: []}});
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:{ message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}});
})

test("pingProcedureKO",async t=>{
    t.plan(14);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<i.message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mess;
    subOut.subscribe(
        x => { 
            
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"numUpdate",contenu:1})   
                    break;
                case 1: //Ajout des collaborateurs
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2,3])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[3,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                case 2: //Génération du premier ping de la procédure
                    mess = { message: 1, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    break;
                case 3: //génération du ping-req
                    mess = { message: 2, numEnvoi: 1, numDest : 3, numCible : 2, set: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess});
                    break;
                case 4: //Réponse au ping, on vérifie l'état du client (2 doit être suspect car la procédure est terminée ko)
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:3,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    t.deepEqual(appli.getCollaborateurs(),[1,2,3])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:3,incarn:0}],[3,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])
                    break;
                case 5:
                    mess = { message: 1, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:3,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess})   
                    break;
                case 6:
                    mess = { message: 2, numEnvoi: 1, numDest : 3, numCible : 2, set: [], piggyback: [[2,{message:3,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess});
                    break;
                case 7:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], piggyback: [[2,{message:4,incarn:0}]]};
                    t.deepEqual(x,{type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:mess}) 
                    t.deepEqual(appli.getCollaborateurs(),[1,3])
                    t.deepEqual(Array.from(appli.getPG()),[[1,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}],[2,{type:i.TYPE_MESPG_LABEL, message:4,incarn:0}],[3,{type:i.TYPE_MESPG_LABEL, message:1,incarn:0}]])  
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        () => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:'message', contenu:{ type:i.TYPE_MESREPSERV_LABEL, message: "repServ", contenu: 1}});
    let rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0}],[3,{message:1,incarn:0}]]};
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:rep});
    appli.pingProcedure(2);
    await delay(2500)
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:{ message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}});
    appli.pingProcedure(2);
    await delay(2500)
    subIn.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"message",contenu:{ message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}});
})