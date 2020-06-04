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
    subOut.subscribe(function (x) { return t.deepEqual(x, { type: "numUpdate", contenu: 1 }); }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'message', contenu: { type: 0, contenu: 1 } });
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
            t.deepEqual(x, { type: "numUpdate", contenu: 1 });
        }
        else {
            var ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"]], piggyback: [] };
            t.deepEqual(x, { type: "message", contenu: ACK });
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'message', contenu: { type: 0, contenu: 1 } });
    var ping = { message: 1, numEnvoi: 2, numDest: 1, set: [], users: [], piggyback: [] };
    subIn.next({ type: "message", contenu: ping });
});
ava_1.default("receptionPingReq", function (t) {
    t.plan(2);
    var cpt = 0;
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    subOut.subscribe(function (x) {
        if (cpt === 0) {
            t.deepEqual(x, { type: "numUpdate", contenu: 1 });
        }
        else {
            var pingReqRep = { message: 1, numEnvoi: 1, numDest: 3, set: [], users: [[1, "Alive"]], piggyback: [] };
            t.deepEqual(x, { type: "message", contenu: pingReqRep });
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'message', contenu: { type: 0, contenu: 1 } });
    var pingReq = { message: 2, numEnvoi: 2, numDest: 1, numCible: 3, set: [], piggyback: [] };
    subIn.next({ type: "message", contenu: pingReq });
});
ava_1.default("joined", function (t) {
    t.plan(2);
    var cpt = 0;
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    subOut.subscribe(function (x) {
        console.log(x);
        if (cpt === 0) {
            t.deepEqual(x, { type: "numUpdate", contenu: 1 });
        }
        else {
            var ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [[2, { message: 1, incarn: 0, cpt: 3 }]] };
            t.deepEqual(x, { type: "message", contenu: ACK });
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'message', contenu: { type: 0, contenu: 1 } });
    var ping = { message: 1, numEnvoi: 2, numDest: 1, set: [], users: [], piggyback: [[2, { message: 1, incarn: 0, cpt: 3 }]] };
    subIn.next({ type: "message", contenu: ping });
});
ava_1.default("decrementationPG", function (t) {
    t.plan(7);
    var cpt = 0;
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    var ACK;
    subOut.subscribe(function (x) {
        console.log(x);
        switch (cpt) {
            case 0:
                t.deepEqual(x, { type: "numUpdate", contenu: 1 });
                break;
            case 1:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [[2, { message: 1, incarn: 0, cpt: 3 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
            case 2:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [[2, { message: 1, incarn: 0, cpt: 2 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
            case 3:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [[2, { message: 1, incarn: 0, cpt: 1 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
            case 4:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [[2, { message: 1, incarn: 0, cpt: 0 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
            default:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [] };
                t.deepEqual(x, { type: "message", contenu: ACK });
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'message', contenu: { type: 0, contenu: 1 } });
    var ping = { message: 1, numEnvoi: 2, numDest: 1, set: [], users: [], piggyback: [[2, { message: 1, incarn: 0, cpt: 3 }]] };
    for (var i = 0; i < 6; i++) {
        subIn.next({ type: "message", contenu: ping });
    }
});
ava_1.default("Suspect & Confirm", function (t) {
    t.plan(4);
    var cpt = 0;
    var appli = new app_1.app();
    var subIn = new rxjs_1.Subject();
    appli.setObsIn(subIn.asObservable());
    var subOut = appli.getObsRes();
    var ACK;
    subOut.subscribe(function (x) {
        console.log(x);
        switch (cpt) {
            case 0:
                t.deepEqual(x, { type: "numUpdate", contenu: 1 });
                break;
            case 1:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Alive"]], piggyback: [[2, { message: 1, incarn: 0, cpt: 3 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
            case 2:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"], [2, "Suspect"]], piggyback: [[2, { message: 3, incarn: 0, cpt: 3 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
            default:
                ACK = { message: 3, numEnvoi: 1, numDest: 2, set: [], users: [[1, "Alive"]], piggyback: [[2, { message: 4, incarn: 0, cpt: 3 }]] };
                t.deepEqual(x, { type: "message", contenu: ACK });
                break;
        }
        cpt++;
    }, function (x) { return t.is(true, false); }, function () { return t.is(true, false); });
    subIn.next({ type: 'message', contenu: { type: 0, contenu: 1 } });
    var ping = { message: 1, numEnvoi: 2, numDest: 1, set: [], users: [], piggyback: [[2, { message: 1, incarn: 0, cpt: 3 }]] };
    subIn.next({ type: "message", contenu: ping });
    ping = { message: 1, numEnvoi: 2, numDest: 1, set: [], users: [], piggyback: [[2, { message: 3, incarn: 0, cpt: 3 }]] };
    subIn.next({ type: "message", contenu: ping });
    ping = { message: 1, numEnvoi: 2, numDest: 1, set: [], users: [], piggyback: [[2, { message: 4, incarn: 0, cpt: 3 }]] };
    subIn.next({ type: "message", contenu: ping });
});
//# sourceMappingURL=app.test.js.map