import { shallMethodBeAutobinded, Autobind } from './autobind';

export function Override(target: any, methodName: string, descriptor: any) {
    if (Object.getPrototypeOf(target)[methodName] === undefined) {
        throw new Error(`${name} does not override a member of its superclass`);
    } else {
        // Manage autobindings
        if (shallMethodBeAutobinded(target, methodName)) {
            return Autobind(target, methodName, descriptor);
        }
    }
}