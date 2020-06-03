"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("../public/app");
var ava_1 = require("ava");
var rxjs_1 = require("rxjs");
ava_1.default("init", function (t) {
    t.plan(1);
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    subOut.subscribe(function (x) { return t.deepEqual(x, { type: "numUpdate", contenu: undefined }); }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'repServ', contenu: 1 });
});
ava_1.default("receptionPing", function (t) {
    t.plan(2);
    var cpt = 0;
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    subOut.subscribe(function (x) {
        if (cpt === 0) {
            t.deepEqual(x, { type: "numUpdate", contenu: undefined });
        }
        else {
            var ACK = JSON.stringify({ message: 3, numEnvoi: 1, numDest: 2, users: undefined, set: undefined, piggyback: undefined });
            t.deepEqual(x, { type: "message", contenu: ACK });
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'repServ', contenu: 1 });
    var ping = JSON.stringify({ message: 1, numEnvoi: 2, numDest: 1, users: undefined, set: undefined, piggyback: undefined });
    subIn.next({ type: "message", contenu: ping });
});
ava_1.default("receptionPingReq_SansReponse", function (t) {
    t.plan(2);
    var cpt = 0;
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    subOut.subscribe(function (x) {
        if (cpt === 0) {
            t.deepEqual(x, { type: "numUpdate", contenu: undefined });
        }
        else {
            var pignReqRep = JSON.stringify({ message: 6, reponse: false, numEnvoi: 1, numDest: 2, set: undefined, piggyback: undefined });
            t.deepEqual(x, { type: "message", contenu: pignReqRep });
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'repServ', contenu: 1 });
    var pingReq = JSON.stringify({ message: 2, numEnvoi: 2, numDest: 1, numCible: 3, set: undefined, piggyback: undefined });
    subIn.next({ type: "message", contenu: pingReq });
});
//# sourceMappingURL=app.test.js.map