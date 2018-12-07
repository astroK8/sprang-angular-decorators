import { includes } from 'lodash';

const AUTOBIND_KEY: string = '_nms_autobindKey';

export function Autobind(...args: any[]) {
    if (args.length === 1) {
        return boundClass(args[0]);
    } else {
        return boundMethod(args[0], args[1], args[2]);
    }
}

function boundClass(target: any) {
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
            Object.defineProperty(target.prototype, <string>key, boundMethod(target, key.toString(), descriptor));
        }
    });
    return target;
}

function boundMethod(target: any, key: any, descriptor: any) {

    let fn = descriptor.value;

    if (typeof fn !== 'function') {
        throw new Error(`@Autobind decorator can only be applied to methods not: ${typeof fn}`);
    }

    addMethodToClassAutobinds(target, key)

    // In IE11 calling Object.defineProperty has a side-effect of evaluating the
    // getter for the property which is being replaced. This causes infinite
    // recursion and an "Out of stack space" error.
    let definingProperty = false;

    return {
        configurable: true,
        get() {
            if (definingProperty || this === target.prototype || this.hasOwnProperty(key)) {
                return fn;
            }
            let boundFn = fn.bind(this);
            definingProperty = true;
            Object.defineProperty(this, key, {
                value: boundFn,
                configurable: true,
                writable: true
            });
            definingProperty = false;
            return boundFn;
        },
        set(newValue: any) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                // IS enumerable when reassigned by the outside word
                enumerable: true,
                value: newValue
            });
        }
    }
}

function addMethodToClassAutobinds(target: any, methodName: string) {
    if (!target[AUTOBIND_KEY]) {
        target[AUTOBIND_KEY] = [methodName];
    } else {
        target[AUTOBIND_KEY].push(methodName);
    }
}

export function shallMethodBeAutobinded(target: any, methodName: string): boolean {
    return includes(target[AUTOBIND_KEY], methodName);
}