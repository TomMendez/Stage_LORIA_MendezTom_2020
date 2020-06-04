import { res } from "../public/res";
import { message } from '../public/interface';
import test from "ava";
import { Subject } from 'rxjs';

test("init",(t)=>{
    t.plan(0);

    //DEBUG Ne marchera pas sans lancer serveur.js

    /**
    const reseau = new res(); 
    const subIn : Subject<message> = new Subject();
    reseau.setObsIn(subIn.asObservable());
    const subOut = reseau.getObsApp();

    subOut.subscribe(
        x => t.is(true,true), //TODO DEBUG
        x => t.is(true,false), //le test échoue, on attends pas d'erreur
        () => t.is(true,false) //le test échoue, l'observable ne doit pas se terminer
    );

    subIn.next({type:'numUpdate', contenu:1});
    */
    
    //DEBUG TESTS A FAIRE
})

//Faire 3 test : message / bloquage /stop devrait suffire