import { styledConsoleLog, getBlackString, getBlueString, getGreenString, getOrangeString, getPurpleString } from './../styled-console/styled-console';
import { overrideConstructor } from './decorator-utils';
import { isUndefined } from 'lodash';
export function Trace() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    switch (args.length) {
        case 1:
            return traceClass.apply(this, args);
        case 3:
            if (typeof args[2] === "number") {
                return traceParameter.apply(this, args);
            }
            else if (args[2] === undefined) {
                return traceProperty.apply(this, args);
            }
            return traceMethod.apply(this, args);
        default:
            throw new Error();
    }
}
function traceClass(target) {
    // save a reference to the original constructor
    var original = target;
    var className = original.name;
    // the new constructor behaviour
    var f = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var message = getGreenString('New')
            + getBlackString(className);
        styledConsoleLog(message, args);
    };
    // _______________ trace all methods of the class ______________________________
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
            Object.defineProperty(target.prototype, key, traceMethod(target, key, descriptor));
        }
    });
    // _____________________________________________
    return overrideConstructor(target, f);
}
function traceMethod(target, key, descriptor) {
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    var originalMethod = descriptor.value;
    //editing the descriptor/value parameter
    descriptor.value = getWrappedMethod(originalMethod, key, target.constructor.name);
    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
}
function traceParameter(target, key, index) {
    var metadataKey = "__trace_" + key + "_parameters";
    if (Array.isArray(target[metadataKey])) {
        target[metadataKey].push(index);
    }
    else {
        target[metadataKey] = [index];
    }
}
function traceProperty(target, key) {
    // property value
    var _val = target[key];
    // property getter
    var getter = function () {
        var message = getBlackString(target.constructor.name)
            + getOrangeString('Get');
        styledConsoleLog(message, _val);
        return _val;
    };
    // property setter
    var setter = function (newVal) {
        var message = getBlackString(target.constructor.name)
            + getPurpleString('Set');
        styledConsoleLog(message, newVal);
        _val = newVal;
    };
    // Delete property.
    if (delete target[key]) {
        // Create new property with getter and setter
        Object.defineProperty(target, key, {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true
        });
    }
}
function getWrappedMethod(originalMethod, methodName, className) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var a = args.map(function (a) {
            var result;
            if (!isUndefined(a)) {
                try {
                    result = JSON.stringify(a);
                }
                catch (e) { }
                finally {
                    if (!result) {
                        result = a.toString();
                    }
                }
            }
            return result;
        }).join();
        var result = originalMethod.apply(this, args);
        var r;
        try {
            r = JSON.stringify(result);
        }
        catch (e) { }
        var message = getBlackString(className)
            + getBlueString(methodName)
            + "(" + a + ") => " + r;
        styledConsoleLog(message);
        return result;
    };
}
//# sourceMappingURL=trace.js.map