"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var output_event_1 = require("./output-event");
exports.EventEmitter = output_event_1.EventEmitter;
var parse_selector_1 = require("./parse-selector");
var decorators_1 = require("./../decorators/decorators");
var BINDINGS_KEY = '__sprang_bindingsKey';
var REQUIRES_KEY = '__sprang_requiresKey';
var INJECTION_NAME_KEY = '__sprang_injectName';
var AUTOWIRING_ARRAY_KEY = '__sprang_inject_array';
var COMPONENT_SCOPE = '__sprang_component_scope';
var COMPONENT_ELEMENT = '__sprang_component_element';
var COMPONENT_ATTRS = '__sprang_component_attrs';
var LISTENBUS_ARRAY_KEY = '__sprang_listenbus_array';
var IS_EVENT_BUS = '__sprang_event_bus';
;
var angularModule;
var registrationQueue = [];
var $injector;
var _injectables = new Set();
var eventBusInjectName;
// Set main angular module to use for registration
function setModule(mod) {
    angularModule = mod;
    for (var _i = 0, registrationQueue_1 = registrationQueue; _i < registrationQueue_1.length; _i++) {
        var registrationItem = registrationQueue_1[_i];
        register(registrationItem);
    }
    registrationQueue = [];
    output_event_1.resolveEvents();
}
exports.setModule = setModule;
function getInjectableName(target) {
    try {
        return target.__sprang_getInjectableName();
    }
    catch (e) {
        throw ('Fail to get injectableName');
    }
}
exports.getInjectableName = getInjectableName;
function register(registrationItem) {
    if (!angularModule) {
        console.debug('Delayed angular registering [' + registrationItem.type + '] : ' + registrationItem.name);
        registrationQueue.push(registrationItem);
    }
    else {
        registrationItem.registerFunc(angularModule);
        console.debug('Angular registering [' + registrationItem.type + '] : ' + registrationItem.name);
    }
}
function buildUniqName(name) {
    return lodash_1.uniqueId(name + '_');
}
/**
 * @Component(options:ComponentOptions)
 */
function Component(options) {
    var selector = parse_selector_1.default(options.selector);
    var decoratorFactory;
    switch (selector.type) {
        case 'E':
            decoratorFactory = function (classConstructor) {
                var overridedConstructor = autowireComponent(classConstructor);
                overridedConstructor = addBusListenersToComponent(overridedConstructor);
                var registrationItem = {
                    registerFunc: function (mod) {
                        var definition = options;
                        if (!definition.controller) {
                            definition.controller = overridedConstructor;
                        }
                        if (overridedConstructor.prototype[BINDINGS_KEY]) {
                            definition.bindings = overridedConstructor.prototype[BINDINGS_KEY];
                        }
                        if (overridedConstructor.prototype[REQUIRES_KEY]) {
                            definition.require = overridedConstructor.prototype[REQUIRES_KEY];
                        }
                        options = definition;
                        mod.component(selector.name, options);
                    },
                    type: 'Component',
                    name: selector.name
                };
                register(registrationItem);
            };
            break;
        case 'A':
            decoratorFactory = function (classConstructor) {
                var overridedConstructor = autowireComponent(classConstructor);
                overridedConstructor = addBusListenersToComponent(overridedConstructor);
                var registrationItem = {
                    registerFunc: function (mod) {
                        var definition = lodash_1.merge(options, {
                            restrict: 'A',
                            controller: overridedConstructor,
                            controllerAs: 'ctrl',
                            bindToController: true
                        });
                        if (overridedConstructor.prototype[BINDINGS_KEY]) {
                            definition.bindToController = overridedConstructor.prototype[BINDINGS_KEY];
                        }
                        if (overridedConstructor.prototype[REQUIRES_KEY]) {
                            definition.require = overridedConstructor.prototype[REQUIRES_KEY];
                        }
                        var directiveFactory = (lodash_1.isFunction(definition) || lodash_1.isArray(definition)
                            ? definition
                            : function () { return definition; });
                        mod.directive(selector.name, directiveFactory);
                    },
                    type: 'Attribute',
                    name: selector.name
                };
                register(registrationItem);
            };
            break;
    }
    return decoratorFactory;
}
exports.Component = Component;
/**
 * @Input(publicName?: string)
 */
function Input(publicName) {
    return function (classPrototype, propertyName) {
        var inputObject = classPrototype[BINDINGS_KEY] || {};
        inputObject[propertyName] = '<' + (publicName || '');
        classPrototype[BINDINGS_KEY] = inputObject;
    };
}
exports.Input = Input;
/**
 * @Output(publicName?: string)
 */
function Output(publicName) {
    return function (classPrototype, propertyName) {
        var name = publicName || propertyName;
        output_event_1.addEvent(name);
        var outputObject = classPrototype[REQUIRES_KEY] || {};
        outputObject['_' + propertyName] = '?' + output_event_1.buildEventSelector(name);
        classPrototype[REQUIRES_KEY] = outputObject;
    };
}
exports.Output = Output;
/**
 * @Filter(name:string)
 */
function Filter(name) {
    return function decoratorFactory(classConstructor) {
        var autowiredConstructor = autowireService(classConstructor);
        var registrationItem = {
            registerFunc: function (mod) {
                var constructor = function () {
                    var instance = new autowiredConstructor();
                    return instance.filter;
                };
                mod.filter(name, constructor);
            },
            type: 'Filter',
            name: name
        };
        register(registrationItem);
    };
}
exports.Filter = Filter;
/**
 * @Service()
 */
function Service() {
    return function decoratorFactory(serviceConstructor) {
        var uniqName = addUniqInjectableNameToConstructor(serviceConstructor);
        if (serviceConstructor.prototype[IS_EVENT_BUS]) {
            eventBusInjectName = uniqName;
        }
        var registrationItem = {
            registerFunc: function (mod) {
                mod.service(uniqName, autowireService(serviceConstructor));
            },
            type: 'Service',
            name: uniqName
        };
        // Auto bind all methods of a service , this is not memory consuming
        // as services are singleton
        decorators_1.Autobind(serviceConstructor);
        register(registrationItem);
    };
}
exports.Service = Service;
/**
 * @Controller(name:string)
 */
function Controller(name) {
    return function decoratorFactory(classConstructor) {
        var injectableName = name ? name : '';
        if (!name) {
            // IE11 doesn't provide classConstructor.name
            var targetName = classConstructor.name ? classConstructor.name : 'controllerX';
            injectableName = _injectables.has(targetName) ? buildUniqName(targetName) : targetName;
        }
        else {
            console.log('>>>>Old controller annotation: ' + name);
        }
        _injectables.add(injectableName);
        var autowiredConstructor = autowireController(classConstructor, injectableName);
        var registrationItem = {
            registerFunc: function (mod) {
                mod.controller(injectableName, autowiredConstructor);
            },
            type: 'Controller',
            name: injectableName
        };
        register(registrationItem);
    };
}
exports.Controller = Controller;
/**
 * @BindString(publicName?: string)
 */
function BindString(publicName) {
    return function (classPrototype, propertyName) {
        var bindStringObject = classPrototype[BINDINGS_KEY] || {};
        bindStringObject[propertyName] = '@' + (publicName || '');
        classPrototype[BINDINGS_KEY] = bindStringObject;
    };
}
exports.BindString = BindString;
/**
 * @Require(publicName?: string)
 */
function Require(ctrlName) {
    return function (classPrototype, propertyName) {
        var requireObject = classPrototype[REQUIRES_KEY] || {};
        requireObject[propertyName] = ctrlName;
        classPrototype[REQUIRES_KEY] = requireObject;
    };
}
exports.Require = Require;
/**
 * @Snabb component
 */
function SnabbComponent() {
    return function (classConstructor) {
        return autowireService(classConstructor);
    };
}
exports.SnabbComponent = SnabbComponent;
/**
 * @Autowired(dep)
 */
function Autowired(dependency) {
    // Instance property : target === the prototype of the class
    // Static property : target === class constructor
    return function decoratorFactory(classPrototype, decoratedPropertyName) {
        var injectArray;
        injectArray = classPrototype[AUTOWIRING_ARRAY_KEY];
        if (!injectArray) {
            injectArray = [];
        }
        injectArray.push({
            propertyName: decoratedPropertyName,
            dependency: dependency
        });
        classPrototype[AUTOWIRING_ARRAY_KEY] = injectArray;
    };
}
exports.Autowired = Autowired;
/**
 * @NgScope
 */
function NgScope(classPrototype, decoratedPropertyName) {
    classPrototype[COMPONENT_SCOPE] = decoratedPropertyName;
}
exports.NgScope = NgScope;
/**
 * @NgElement
 */
function NgElement(classPrototype, decoratedPropertyName) {
    classPrototype[COMPONENT_ELEMENT] = decoratedPropertyName;
}
exports.NgElement = NgElement;
/**
 * @NgAttrs
 */
function NgAttrs(classPrototype, decoratedPropertyName) {
    classPrototype[COMPONENT_ATTRS] = decoratedPropertyName;
}
exports.NgAttrs = NgAttrs;
/**
 * @ListenBus(()=>Event or Event[])
 *
 */
function ListenBus(getEvents) {
    return function (classPrototype, decoratedPropertyName) {
        var listenBusItems;
        listenBusItems = classPrototype[LISTENBUS_ARRAY_KEY];
        if (!listenBusItems) {
            listenBusItems = [];
        }
        listenBusItems.push({
            propertyName: decoratedPropertyName,
            getEvents: getEvents
        });
        classPrototype[LISTENBUS_ARRAY_KEY] = listenBusItems;
    };
}
exports.ListenBus = ListenBus;
/**
 * @NgEventBus
 *
 * Annotate event bus class
 */
function NgEventBus(serviceConstructor) {
    serviceConstructor.prototype[IS_EVENT_BUS] = true;
}
exports.NgEventBus = NgEventBus;
function addBusListenersToComponent(classConstructor) {
    var overridedConstructor = classConstructor;
    var listenBusItems = classConstructor.prototype[LISTENBUS_ARRAY_KEY] || [];
    overridedConstructor = decorators_1.DecoratorUtils.overrideConstructor(classConstructor, function () {
        var _this = this;
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
        console.debug('___________________________');
        console.debug('Add bus listeners of component', classConstructor.name);
        console.debug('___________________________');
        var sprangEventBus = $injector.get(eventBusInjectName);
        var listenBusManager = sprangEventBus.getEventBusListenerManager();
        listenBusItems.forEach(function (listenBusItem) {
            var events = listenBusItem.getEvents();
            listenBusManager.addEventListener(events, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                _this[listenBusItem.propertyName].apply(_this, args);
            });
            var original$onDestroy = _this['$onDestroy'];
            _this['$onDestroy'] = function () {
                original$onDestroy.apply(_this);
                listenBusManager.unsubscribeAll();
            };
        });
    });
    return overridedConstructor;
}
function autowireService(classConstructor) {
    var overridedConstructor = classConstructor;
    var autowiringArray = classConstructor.prototype[AUTOWIRING_ARRAY_KEY];
    if (autowiringArray) {
        overridedConstructor = decorators_1.DecoratorUtils.overrideConstructor(classConstructor, function () {
            var _this = this;
            console.debug('___________________________');
            console.debug('Autowiring of service', classConstructor.name);
            console.debug('___________________________');
            autowiringArray.forEach(function (injection) {
                var injectionName;
                if (lodash_1.isString(injection.dependency)) {
                    injectionName = injection.dependency;
                }
                else {
                    injectionName = injection.dependency().__sprang_getInjectableName();
                }
                console.debug(injection.propertyName + ' <- ' + injectionName);
                _this[injection.propertyName] = $injector.get(injectionName);
            });
        });
    }
    return overridedConstructor;
}
function autowireComponent(classConstructor) {
    var overridedConstructor = classConstructor;
    var autowiringArray = classConstructor.prototype[AUTOWIRING_ARRAY_KEY] || [];
    // Ask Angular to inject $element and $scope into component constructor
    overridedConstructor.$inject = ['$element', '$scope', '$attrs'];
    overridedConstructor = decorators_1.DecoratorUtils.overrideConstructor(classConstructor, function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        console.debug('___________________________');
        console.debug('Autowiring of component', classConstructor.name);
        console.debug('___________________________');
        autowiringArray.forEach(function (injection) {
            var injectionName;
            if (lodash_1.isString(injection.dependency)) {
                injectionName = injection.dependency;
            }
            else {
                injectionName = injection.dependency().__sprang_getInjectableName();
            }
            console.debug(injection.propertyName + ' <- ' + injectionName);
            _this[injection.propertyName] = $injector.get(injectionName);
        });
        if (classConstructor.prototype[COMPONENT_ELEMENT]) {
            this[classConstructor.prototype[COMPONENT_ELEMENT]] = args[0];
        }
        if (classConstructor.prototype[COMPONENT_SCOPE]) {
            this[classConstructor.prototype[COMPONENT_SCOPE]] = args[1];
        }
        if (classConstructor.prototype[COMPONENT_ATTRS]) {
            this[classConstructor.prototype[COMPONENT_ATTRS]] = args[2];
        }
    });
    return overridedConstructor;
}
function autowireController(classConstructor, name) {
    var overridedConstructor = classConstructor;
    var autowiringArray = classConstructor.prototype[AUTOWIRING_ARRAY_KEY] || [];
    // Ask Angular to inject $element and $scope into component constructor
    overridedConstructor.$inject = ['$scope'];
    overridedConstructor.__sprang_getInjectableName = function () {
        return name;
    };
    overridedConstructor = decorators_1.DecoratorUtils.overrideConstructor(classConstructor, function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        console.debug('___________________________');
        console.debug('Autowiring of controller', classConstructor.name);
        console.debug('___________________________');
        autowiringArray.forEach(function (injection) {
            var injectionName;
            if (lodash_1.isString(injection.dependency)) {
                injectionName = injection.dependency;
            }
            else {
                injectionName = injection.dependency().__sprang_getInjectableName();
            }
            console.debug(injection.propertyName + ' <- ' + injectionName);
            _this[injection.propertyName] = $injector.get(injectionName);
        });
        var scope = args[0];
        // Controller added in scope as $ctrl
        scope.$ctrl = this;
        // Calls controller $onDestroy when scope destroyed 
        scope.$on('$destroy', function () {
            if (_this.$onDestroy) {
                _this.$onDestroy();
            }
        });
    });
    return overridedConstructor;
}
function startAutowiring(injector) {
    console.debug('Autowiring ready');
    $injector = injector;
}
exports.startAutowiring = startAutowiring;
function addUniqInjectableNameToConstructor(classConstructor) {
    // IE11 doesn't provide classConstructor.name
    var targetName = classConstructor.name ? classConstructor.name : 'serviceX';
    var uniqName = _injectables.has(targetName) ? buildUniqName(targetName) : targetName;
    classConstructor[INJECTION_NAME_KEY] = uniqName;
    classConstructor.__sprang_getInjectableName = function () {
        return uniqName;
    };
    _injectables.add(uniqName);
    return uniqName;
}
//# sourceMappingURL=sprang-angular-decorators.js.map