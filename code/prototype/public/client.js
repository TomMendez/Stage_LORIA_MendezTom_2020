import { coef } from './const.js';
import { app } from './app.js';
import { res } from './res.js';
import { ui } from './ui.js';
var appli = new app();
var reseau = new res();
var uInterface = new ui();
appli.setObsIn(reseau.getObsApp());
appli.setObsIn(uInterface.getObsApp());
reseau.setObsIn(appli.getObsRes());
reseau.setObsIn(uInterface.getObsRes());
uInterface.setObsIn(appli.getObsUI());
uInterface.setObsIn(reseau.getObsUI());
setInterval(function () { return appli.gossiping(); }, 10 * coef);
//# sourceMappingURL=client.js.map