"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var autobind_1 = require("./autobind");
function Override(target, methodName, descriptor) {
    if (Object.getPrototypeOf(target)[methodName] === undefined) {
        throw new Error(name + " does not override a member of its superclass");
    }
    else {
        // Manage autobindings
        if (autobind_1.shallMethodBeAutobinded(target, methodName)) {
            return autobind_1.Autobind(target, methodName, descriptor);
        }
    }
}
exports.Override = Override;
//# sourceMappingURL=override.js.map