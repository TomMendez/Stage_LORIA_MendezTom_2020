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
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    const ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: []};
                    t.deepEqual(x,{type:"message",contenu:ACK});
                    break; 
                default:
                    t.is(true,false);
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
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    const pingReqRep = { message: 1, numEnvoi: 1, numDest: 3, set: [], users: [[1,"Alive"]], piggyback: []};
                    t.deepEqual(x,{type:"message",contenu:pingReqRep})  
                    break; 
                default:
                    t.is(true,false);
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
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    const ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
                default:
                    t.is(true,false);
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
                case 5:
                case 6:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: []};
                    t.deepEqual(x,{type:"message",contenu:ACK}); 
                    break;
                default:
                    t.is(true,false);
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
                case 3:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: [[2,{message:4,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK}) 
                    break;
                default:
                    t.is(true,false);
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
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: [[1,{message:2,incarn:1,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
                default:
                    t.is(true,false);
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

test("prioritéPG",(t)=>{
    t.plan(6);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let ACK;
    subOut.subscribe(
        x => { 
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
                case 3:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Suspect"]], piggyback: [[2,{message:3,incarn:0,cpt:2}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
                case 4:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:2,incarn:1,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
                case 5:
                    ACK = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"]], piggyback: [[2,{message:4,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:ACK})   
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    let ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:3,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:2,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:2,incarn:1,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
    ping = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:4,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:ping});
})

test("pingProcedureOKdirect",(t)=>{
    t.plan(4);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mess;
    subOut.subscribe(
        x => { 
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 2:
                    mess = { message: 1, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:2}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 3:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:1}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    let rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:rep});
    appli.pingProcedure(2);
    rep = { message: 3, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []};
    subIn.next({type:"message",contenu:rep});
    rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []};
    subIn.next({type:"message",contenu:rep});
})

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

test("pingProcedureOKindirect",async t=>{
    t.plan(5);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mess;
    subOut.subscribe(
        x => { 

            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}],[3,{message:1,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 2:
                    mess = { message: 1, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:2}],[3,{message:1,incarn:0,cpt:2}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 3:
                    mess = { message: 2, numEnvoi: 1, numDest : 3, numCible : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:1}],[3,{message:1,incarn:0,cpt:1}]]};
                    t.deepEqual(x,{type:"message",contenu:mess});
                    break;
                case 4:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:0}],[3,{message:1,incarn:0,cpt:0}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    let rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}],[3,{message:1,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:rep});
    appli.pingProcedure(2);
    await delay(1000)
    subIn.next({type:"message",contenu:{ message: 6, reponse: true, numEnvoi: 3, numDest: 1, set: [], piggyback: []}});
    subIn.next({type:"message",contenu:{ message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}});
})

test("pingProcedureKO",async t=>{
    t.plan(8);

    let cpt =0;

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mess;
    subOut.subscribe(
        x => { 
            
            switch(cpt){
                case 0:
                    t.deepEqual(x,{type:"numUpdate",contenu:1})   
                    break;
                case 1:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:3}],[3,{message:1,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 2:
                    mess = { message: 1, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:2}],[3,{message:1,incarn:0,cpt:2}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 3:
                    mess = { message: 2, numEnvoi: 1, numDest : 3, numCible : 2, set: [], users: [[1,"Alive"],[2,"Alive"],[3,"Alive"]], piggyback: [[2,{message:1,incarn:0,cpt:1}],[3,{message:1,incarn:0,cpt:1}]]};
                    t.deepEqual(x,{type:"message",contenu:mess});
                    break;
                case 4:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Suspect"],[3,"Alive"]], piggyback: [[2,{message:3,incarn:0,cpt:3}],[3,{message:1,incarn:0,cpt:0}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 5:
                    mess = { message: 1, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[2,"Suspect"],[3,"Alive"]], piggyback: [[2,{message:3,incarn:0,cpt:2}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                case 6:
                    mess = { message: 2, numEnvoi: 1, numDest : 3, numCible : 2, set: [], users: [[1,"Alive"],[2,"Suspect"],[3,"Alive"]], piggyback: [[2,{message:3,incarn:0,cpt:1}]]};
                    t.deepEqual(x,{type:"message",contenu:mess});
                    break;
                case 7:
                    mess = { message: 3, numEnvoi: 1, numDest : 2, set: [], users: [[1,"Alive"],[3,"Alive"]], piggyback: [[2,{message:4,incarn:0,cpt:3}]]};
                    t.deepEqual(x,{type:"message",contenu:mess})   
                    break;
                default:
                    t.is(true,false);
            }
            cpt++;
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'message', contenu:{ type: 0, contenu: 1}}); //initialisation du collaborateur
    let rep = { message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: [[2,{message:1,incarn:0,cpt:3}],[3,{message:1,incarn:0,cpt:3}]]};
    subIn.next({type:"message",contenu:rep});
    appli.pingProcedure(2);
    await delay(3000)
    subIn.next({type:"message",contenu:{ message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}});
    appli.pingProcedure(2);
    await delay(3000)
    subIn.next({type:"message",contenu:{ message: 1, numEnvoi: 2, numDest : 1, set: [], users: [], piggyback: []}});
})