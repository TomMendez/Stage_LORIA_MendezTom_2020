import { coef } from './const.js';
import { app } from './app.js';
import { res } from './res.js'; 
import { ui } from './ui.js';

const appli = new app();
const reseau = new res();
const uInterface = new ui();

appli.setObsIn(reseau.getObsApp());
appli.setObsIn(uInterface.getObsApp());
reseau.setObsIn(appli.getObsRes());
reseau.setObsIn(uInterface.getObsRes());
uInterface.setObsIn(appli.getObsUI());
uInterface.setObsIn(reseau.getObsUI());

setInterval(() => appli.gossiping(),20*coef);