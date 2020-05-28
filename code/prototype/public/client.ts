import { coef } from './const.js';
import { app } from './app.js';
import { res } from './res.js'; 
import { ui } from './ui.js';

let appli = new app();
let reseau = new res();
let uInterface = new ui();

appli.setObsIn(reseau.getObsApp());
appli.setObsIn(uInterface.getObsApp());
reseau.setObsIn(appli.getObsRes());
reseau.setObsIn(uInterface.getObsRes());
uInterface.setObsIn(appli.getObsUI());
uInterface.setObsIn(reseau.getObsUI());

setInterval(() => appli.gossiping(),20*coef);