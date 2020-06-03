"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var const_js_1 = require("./const.js");
var app_js_1 = require("./app.js");
var res_js_1 = require("./res.js");
var ui_js_1 = require("./ui.js");
var appli = new app_js_1.app();
var reseau = new res_js_1.res();
var uInterface = new ui_js_1.ui();
appli.setObsIn(reseau.getObsApp());
appli.setObsIn(uInterface.getObsApp());
reseau.setObsIn(appli.getObsRes());
reseau.setObsIn(uInterface.getObsRes());
uInterface.setObsIn(appli.getObsUI());
uInterface.setObsIn(reseau.getObsUI());
setInterval(function () { return appli.gossiping(); }, 20 * const_js_1.coef);
//# sourceMappingURL=client.js.map