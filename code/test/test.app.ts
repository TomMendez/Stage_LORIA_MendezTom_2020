import { app } from "../public/app.ts";
import test from "ava";
import { Subject } from 'rxjs';

test("init",(t)=>{
    const appli = new app(); 
    const subIn = new Subject();
    const subOut = appli.setObsIn(subIn);

    this.subjIn.next(JSON.stringify({ message: 'repServ', num: 1}));
    
})

test("receptionPing",(t)=>{
    const appli = new app(); 
    const subIn = new Subject();
    const subOut = appli.setObsIn(subIn);

    let mesGen = undefined;
    subOut.subscribe(
        x => mesGen=x,
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    this.subjIn.next(JSON.stringify({ message: 'repServ', num: 1})); //initialisation du collaborateur
    const json = JSON.stringify({ message: 1, numEnvoi: 2, numDest : 1, users: undefined, set: undefined, piggyback: undefined}); //On crée un ping en direction du colalborateur
    this.subjIn.next({type:"message",contenu:json});
    
    const json2 = JSON.stringify({ message: 2, numEnvoi: 1, numDest : 2, users: undefined, set: undefined, piggyback: undefined});
    this.is(mesGen,{type:"message",contenu:json2})
})