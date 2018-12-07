import { styledConsoleLog, getBlackString, getBlueString, getGreenString, getOrangeString, getPurpleString } from './../styled-console/styled-console';
import { overrideConstructor } from './decorator-utils';
import { isUndefined } from 'lodash';

export function Trace(...args: any[]) {
        switch (args.length) {
            case 1:
                return traceClass.apply(this, args);
            case 3:
                if (typeof args[2] === "number") {
                    return traceParameter.apply(this, args);
                } else if (args[2] === undefined) {
                    return traceProperty.apply(this, args);
                }
                return traceMethod.apply(this, args);
            default:
                throw new Error();
        }
}

function traceClass(target: any) {
    // save a reference to the original constructor
    let original = target;

    let className = original.name;

    // the new constructor behaviour
    let f: any = function (...args: any[]) {
        let message = getGreenString('New')
            + getBlackString(className);
        styledConsoleLog(message, args);
    };

    // _______________ trace all methods of the class ______________________________

    // (Using reflect to get all keys including symbols)
    let keys;
    // Use Reflect if exists
    if (typeof Reflect !== 'undefined' && typeof Reflect.ownKeys === 'function') {
        keys = Reflect.ownKeys(target.prototype);
    } else {
        keys = Object.getOwnPropertyNames(target.prototype);
        // use symbols if support is provided
        if (typeof (<any>Object).getOwnPropertySymbols === 'function') {
            keys = keys.concat((<any>Object).getOwnPropertySymbols(target.prototype));
        }
    }

    keys.forEach(key => {
        // Ignore special case target method
        if (key === 'constructor') {
            return;
        }

        let descriptor = Object.getOwnPropertyDescriptor(target.prototype, <string>key);

        // Only methods need binding
        if (descriptor && typeof descriptor.value === 'function') {
            Object.defineProperty(target.prototype, <string>key, traceMethod(target, key, descriptor));
        }
    });

    // _____________________________________________

    return overrideConstructor(target, f);

}

function traceMethod(target: any, key: any, descriptor: any) {

    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    let originalMethod = descriptor.value;

    //editing the descriptor/value parameter
    descriptor.value = getWrappedMethod(originalMethod, key, target.constructor.name);

    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
}

function traceParameter(target: any, key: string, index: number) {
    let metadataKey = `__trace_${key}_parameters`;
    if (Array.isArray(target[metadataKey])) {
        target[metadataKey].push(index);
    }
    else {
        target[metadataKey] = [index];
    }
}

function traceProperty(target: any, key: string) {

    // property value
    let _val = target[key];

    // property getter
    let getter = function () {
        let message: string = getBlackString(target.constructor.name)
            + getOrangeString('Get')
        styledConsoleLog(message, _val);
        return _val;
    };

    // property setter
    let setter = function (newVal: any) {
        let message: string = getBlackString(target.constructor.name)
            + getPurpleString('Set')
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

function getWrappedMethod(originalMethod: Function, methodName: string, className: string) {
    return function (...args: any[]) {
        let a = args.map((a) => {
            let result;
            if (!isUndefined(a)) {
                try {
                    result = JSON.stringify(a);
                } catch (e) { }
                finally {
                    if (!result) {
                        result = a.toString();
                    }
                }
            }
            return result;
        }).join();
        let result = originalMethod.apply(this, args);
        let r;
        try {
            r = JSON.stringify(result);
        } catch (e) { }
        let message: string = getBlackString(className)
            + getBlueString(methodName)
            + "(" + a + ") => " + r;
        styledConsoleLog(message);
        return result;
    }
}