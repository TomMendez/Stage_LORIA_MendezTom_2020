import { app } from "../public/app";
import { message } from '../public/interface';
import test from "ava";
import { Subject } from 'rxjs';

test("init",(t)=>{
    t.plan(0);

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    subIn.next({ type: 'repServ', contenu: 1});
    
    //TESTS A FAIRE
})

test("receptionPing",(t)=>{
    t.plan(1);

    const appli = new app(); 
    const subIn : Subject<message> = new Subject();
    appli.setObsIn(subIn.asObservable());
    const subOut = appli.getObsRes();

    let mesGen = undefined;
    subOut.subscribe(
        x => { 
            mesGen=x
            const json2 = JSON.stringify({ message: 2, numEnvoi: 1, numDest : 2, users: undefined, set: undefined, piggyback: undefined});
            t.is(mesGen,{type:"message",contenu:json2}) 
        },
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({ type: 'repServ', contenu: 1}); //initialisation du collaborateur
    const json = JSON.stringify({ message: 1, numEnvoi: 2, numDest : 1, users: undefined, set: undefined, piggyback: undefined}); //On crée un ping en direction du colalborateur
    subIn.next({type:"message",contenu:json});
})