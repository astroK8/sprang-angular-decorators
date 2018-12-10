import { shallMethodBeAutobinded, Autobind } from './autobind';
export function Override(target, methodName, descriptor) {
    if (Object.getPrototypeOf(target)[methodName] === undefined) {
        throw new Error(name + " does not override a member of its superclass");
    }
    else {
        // Manage autobindings
        if (shallMethodBeAutobinded(target, methodName)) {
            return Autobind(target, methodName, descriptor);
        }
    }
}
//# sourceMappingURL=override.js.map