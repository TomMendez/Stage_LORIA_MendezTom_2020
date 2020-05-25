import { coef } from './const';
import { app } from './app';
import { res } from './res'; 
import { ui } from './ui';

let appli = new app();
let reseau = new res();
let uInterface = new ui();

console.log('debug'); //DEBUG

appli.setObsIn(reseau.getObsApp());
appli.setObsIn(uInterface.getObsApp());
reseau.setObsIn(appli.getObsRes());
reseau.setObsIn(uInterface.getObsRes());
uInterface.setObsIn(appli.getObsUI());
uInterface.setObsIn(reseau.getObsUI());

setInterval(() => appli.gossiping(),10*coef);