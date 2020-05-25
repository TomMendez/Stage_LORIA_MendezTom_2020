import { coef } from './const';
import { app } from './app';
import { res } from './res';
import { ui } from './ui';
var appli = new app();
var reseau = new res();
var uInterface = new ui();
console.log('debug');
appli.setObsIn(reseau.getObsApp());
appli.setObsIn(uInterface.getObsApp());
reseau.setObsIn(appli.getObsRes());
reseau.setObsIn(uInterface.getObsRes());
uInterface.setObsIn(appli.getObsUI());
uInterface.setObsIn(reseau.getObsUI());
setInterval(function () { return appli.gossiping(); }, 10 * coef);
//# sourceMappingURL=client.js.map