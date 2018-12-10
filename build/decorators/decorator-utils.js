"use strict";
/**
 *
 * Override a class constructor
 *
 * @export
 * @param {class} target
 * @param {Function} g  // E.g: function(){this.x=2}
 * @returns class with overrided constructor
 */
Object.defineProperty(exports, "__esModule", { value: true });
function overrideConstructor(target, g) {
    // save a reference to the original constructor
    var original = target;
    // the new constructor behaviour
    var f = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        g.apply(this, args);
        return original.apply(this, args);
    };
    // Copy static methods
    for (var statics in original) {
        if (statics) {
            f[statics] = original[statics];
        }
    }
    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;
    // return new constructor (will override original)
    return f;
}
exports.overrideConstructor = overrideConstructor;
//# sourceMappingURL=decorator-utils.js.map