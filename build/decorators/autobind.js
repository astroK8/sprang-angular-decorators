"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var AUTOBIND_KEY = '_nms_autobindKey';
function Autobind() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (args.length === 1) {
        return boundClass(args[0]);
    }
    else {
        return boundMethod(args[0], args[1], args[2]);
    }
}
exports.Autobind = Autobind;
function boundClass(target) {
    // (Using reflect to get all keys including symbols)
    var keys;
    // Use Reflect if exists
    if (typeof Reflect !== 'undefined' && typeof Reflect.ownKeys === 'function') {
        keys = Reflect.ownKeys(target.prototype);
    }
    else {
        keys = Object.getOwnPropertyNames(target.prototype);
        // use symbols if support is provided
        if (typeof Object.getOwnPropertySymbols === 'function') {
            keys = keys.concat(Object.getOwnPropertySymbols(target.prototype));
        }
    }
    keys.forEach(function (key) {
        // Ignore special case target method
        if (key === 'constructor') {
            return;
        }
        var descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
        // Only methods need binding
        if (descriptor && typeof descriptor.value === 'function') {
            Object.defineProperty(target.prototype, key, boundMethod(target, key.toString(), descriptor));
        }
    });
    return target;
}
function boundMethod(target, key, descriptor) {
    var fn = descriptor.value;
    if (typeof fn !== 'function') {
        throw new Error("@Autobind decorator can only be applied to methods not: " + typeof fn);
    }
    addMethodToClassAutobinds(target, key);
    // In IE11 calling Object.defineProperty has a side-effect of evaluating the
    // getter for the property which is being replaced. This causes infinite
    // recursion and an "Out of stack space" error.
    var definingProperty = false;
    return {
        configurable: true,
        get: function () {
            if (definingProperty || this === target.prototype || this.hasOwnProperty(key)) {
                return fn;
            }
            var boundFn = fn.bind(this);
            definingProperty = true;
            Object.defineProperty(this, key, {
                value: boundFn,
                configurable: true,
                writable: true
            });
            definingProperty = false;
            return boundFn;
        },
        set: function (newValue) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                // IS enumerable when reassigned by the outside word
                enumerable: true,
                value: newValue
            });
        }
    };
}
function addMethodToClassAutobinds(target, methodName) {
    if (!target[AUTOBIND_KEY]) {
        target[AUTOBIND_KEY] = [methodName];
    }
    else {
        target[AUTOBIND_KEY].push(methodName);
    }
}
function shallMethodBeAutobinded(target, methodName) {
    return lodash_1.includes(target[AUTOBIND_KEY], methodName);
}
exports.shallMethodBeAutobinded = shallMethodBeAutobinded;
//# sourceMappingURL=autobind.js.map