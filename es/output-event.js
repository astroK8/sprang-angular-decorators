var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, NgElement, NgScope, Autowired, NgAttrs } from './sprang-angular-decorators';
var events = new Set([
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'keydown',
    'keyup',
    'keypress',
    'submit',
    'focus',
    'blur',
    'copy',
    'cut',
    'paste',
    'change',
    'dragstart',
    'drag',
    'dragenter',
    'dragleave',
    'dragover',
    'drop',
    'dragend',
    'error',
    'input',
    'load',
    'wheel',
    'scroll'
]);
/**
* create an attribute directive directive for each event of the set
*
* <elt (my-custom-event)="f($event,e)"></elt> for event myCustomEvent
*/
export function resolveEvents() {
    events.forEach(function (event) {
        var selector = buildEventSelector(event);
        var EventHandler = /** @class */ (function () {
            function EventHandler() {
            }
            EventHandler.prototype.$onInit = function () {
                this.expression = this.$parse(this.$attrs[selector]);
            };
            EventHandler.prototype.$postLink = function () {
                var _this = this;
                this.$element.on(event, function (e) { return _this.eventHandler(e); });
            };
            EventHandler.prototype.$onDestroy = function () {
                this.$element.off(event);
            };
            EventHandler.prototype.$onChanges = function (_changes) { };
            EventHandler.prototype.$doCheck = function () { };
            EventHandler.prototype.emit = function ($event) {
                this.eventHandler($event);
            };
            EventHandler.prototype.eventHandler = function ($event) {
                var _this = this;
                if ($event === void 0) { $event = {}; }
                if ($event.detail && $event.detail._output !== undefined) {
                    $event = $event.detail._output;
                }
                if ($event.originalEvent && $event.originalEvent.detail && $event.originalEvent.detail._output) {
                    $event = $event.detail._output;
                }
                this.$scope.$evalAsync(function () {
                    _this.expression(_this.$scope, { $event: $event });
                });
            };
            __decorate([
                NgElement
            ], EventHandler.prototype, "$element", void 0);
            __decorate([
                NgScope
            ], EventHandler.prototype, "$scope", void 0);
            __decorate([
                NgAttrs
            ], EventHandler.prototype, "$attrs", void 0);
            __decorate([
                Autowired('$parse')
            ], EventHandler.prototype, "$parse", void 0);
            EventHandler = __decorate([
                Component({
                    selector: '[' + selector + ']'
                })
            ], EventHandler);
            return EventHandler;
        }());
        window.removeTSCWarn = new EventHandler();
        window.removeTSCWarn = null;
    });
}
export function buildEventSelector(name) {
    return '(' + name + ')';
}
export function addEvent(event) {
    events.add(event);
}
// Calls emit only if attribute for event  ( (event)="..." ) is set on html element
var EventEmitter = /** @class */ (function () {
    function EventEmitter(eventName, componentInstance) {
        var _this = this;
        this.eventName = eventName;
        this.componentInstance = componentInstance;
        this.emit = function ($event) {
            var eventEmitter = _this.componentInstance['_' + _this.eventName];
            if (eventEmitter) {
                eventEmitter.emit($event);
            }
        };
    }
    return EventEmitter;
}());
export { EventEmitter };
//# sourceMappingURL=output-event.js.map