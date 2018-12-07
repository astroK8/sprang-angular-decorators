/**
 * 
 * Override a class constructor
 * 
 * @export
 * @param {class} target 
 * @param {Function} g  // E.g: function(){this.x=2} 
 * @returns class with overrided constructor
 */

export function overrideConstructor(target: any, g: Function) {

    // save a reference to the original constructor
    let original = target;

    // the new constructor behaviour
    let f: any = function (...args: any[]) {
        g.apply(this, args);
        return original.apply(this, args);
    };

    // Copy static methods
    for (let statics in original) {
        if (statics) {
            f[statics] = original[statics];
        }
    }

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;

    // return new constructor (will override original)
    return f;


}