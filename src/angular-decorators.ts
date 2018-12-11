import { uniqueId, merge, isFunction, isArray, isString } from 'lodash';
import { addEvent, resolveEvents, buildEventSelector, EventEmitter } from './output-event';
import parseSelector from './parse-selector';
import { Autobind, DecoratorUtils } from './decorators/decorators';
import { EventBusListenerManagerProvider } from './EventBusListenerManagerProvider';

const BINDINGS_KEY: string = '__sprang_bindingsKey';
const REQUIRES_KEY: string = '__sprang_requiresKey';
const INJECTION_NAME_KEY: string = '__sprang_injectName';
const AUTOWIRING_ARRAY_KEY: string = '__sprang_inject_array';
const COMPONENT_SCOPE: string = '__sprang_component_scope';
const COMPONENT_ELEMENT: string = '__sprang_component_element';
const COMPONENT_ATTRS = '__sprang_component_attrs';
const LISTENBUS_ARRAY_KEY: string = '__sprang_listenbus_array';
const IS_EVENT_BUS: string = '__sprang_event_bus';

type RegistrationType = 'Service' | 'Component' | 'Filter' | 'Attribute' | 'Controller';

type RegisterFunction = (module: ng.IModule) => void;

type InjectFunc = () => Function;
type Injected = string | InjectFunc;

interface RegistrationItem {
    registerFunc: RegisterFunction;
    name: string;
    type: RegistrationType;
};

interface ComponentOptions extends ng.IComponentOptions {
    selector: string;
}

interface InjectItem {
    propertyName: string;
    dependency: Injected;
}

interface ListenItem<T> {
    propertyName: string;
    getEvents: () => T | T[]
}

let angularModule: ng.IModule;
let registrationQueue: RegistrationItem[] = [];
let $injector: ng.auto.IInjectorService;
let _injectables = new Set() as Set<string>;
let eventBusInjectName: string;

// Set main angular module to use for registration
export function setModule(mod: ng.IModule) {
    angularModule = mod;

    for (let registrationItem of registrationQueue) {
        register(registrationItem);
    }
    registrationQueue = [];

    resolveEvents();

}

export function getInjectableName(target:any):string {
    try {
        return target.__sprang_getInjectableName();
    } catch(e) {
        throw('Fail to get injectableName');
    }
}

function register(registrationItem: RegistrationItem) {
    if (!angularModule) {
        console.debug('Delayed angular registering [' + registrationItem.type + '] : ' + registrationItem.name);
        registrationQueue.push(registrationItem);
    } else {
        registrationItem.registerFunc(angularModule);
        console.debug('Angular registering [' + registrationItem.type + '] : ' + registrationItem.name);
    }
}

function buildUniqName(name: string): string {
    return uniqueId(name + '_');
}

export { EventEmitter }

/**
 * @Component(options:ComponentOptions)
 */
export function Component(options: ComponentOptions) {

    let selector = parseSelector(options.selector);

    let decoratorFactory: any;

    switch (selector.type) {
        case 'E':
            decoratorFactory = (classConstructor: any): void => {
                let overridedConstructor = autowireComponent(classConstructor);
                overridedConstructor = addBusListenersToComponent(overridedConstructor);
                let registrationItem: RegistrationItem = {
                    registerFunc: (mod: ng.IModule) => {
                        let definition = options;
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

                        mod.component(
                            selector.name,
                            options
                        );
                    },
                    type: 'Component',
                    name: selector.name
                };

                register(registrationItem);

            };
            break;
        case 'A':
            decoratorFactory = (classConstructor: any): void => {
                let overridedConstructor = autowireComponent(classConstructor);
                overridedConstructor = addBusListenersToComponent(overridedConstructor);
                let registrationItem: RegistrationItem = {
                    registerFunc: (mod: ng.IModule) => {

                        let definition = merge(options, {
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

                        let directiveFactory = <any>(isFunction(definition) || isArray(definition)
                            ? definition
                            : function () { return definition; });

                        mod.directive(
                            selector.name,
                            directiveFactory
                        );
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

/**
 * @Input(publicName?: string)
 */
export function Input(publicName?: string) {
    return (classPrototype: any, propertyName: string) => {
        let inputObject = classPrototype[BINDINGS_KEY] || {};
        inputObject[propertyName] = '<' + (publicName || '');
        classPrototype[BINDINGS_KEY] = inputObject;
    };
}

/**
 * @Output(publicName?: string)
 */
export function Output(publicName?: string) {
    return (classPrototype: any, propertyName: string) => {
        let name = publicName || propertyName;
        addEvent(name);
        let outputObject = classPrototype[REQUIRES_KEY] || {};
        outputObject['_' + propertyName] = '?' + buildEventSelector(name);
        classPrototype[REQUIRES_KEY] = outputObject;
    };
}

/**
 * @Filter(name:string)
 */
export function Filter(name: string) {

    return function decoratorFactory(classConstructor: any): void {
        let autowiredConstructor = autowireService(classConstructor);
        let registrationItem: RegistrationItem = {
            registerFunc: (mod: ng.IModule) => {
                let constructor = function () {
                    let instance = new autowiredConstructor();
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

/**
 * @Service()
 */
export function Service() {

    return function decoratorFactory(serviceConstructor: any): void {

        let uniqName = addUniqInjectableNameToConstructor(serviceConstructor);

        if (serviceConstructor.prototype[IS_EVENT_BUS]) {
            eventBusInjectName = uniqName;
        }

        let registrationItem: RegistrationItem = {
            registerFunc: (mod: ng.IModule) => {
                mod.service(uniqName, autowireService(serviceConstructor));
            },
            type: 'Service',
            name: uniqName
        };

        // Auto bind all methods of a service , this is not memory consuming
        // as services are singleton
        Autobind(serviceConstructor);

        register(registrationItem);
    };
}

/**
 * @Controller(name:string)
 */
export function Controller(name?: string) {
    return function decoratorFactory(classConstructor: any): void {

        let injectableName: string = name ? name : '';

        if (!name) {
            // IE11 doesn't provide classConstructor.name
            let targetName = classConstructor.name ? classConstructor.name : 'controllerX';
            injectableName = _injectables.has(targetName) ? buildUniqName(targetName) : targetName;
        } else {
            console.log('>>>>Old controller annotation: ' + name);
        }

        _injectables.add(injectableName);

        let autowiredConstructor = autowireController(classConstructor, injectableName);

        let registrationItem: RegistrationItem = {
            registerFunc: (mod: ng.IModule) => {
                mod.controller(
                    injectableName,
                    autowiredConstructor
                );
            },
            type: 'Controller',
            name: injectableName
        };

        register(registrationItem);
    };
}

/**
 * @BindString(publicName?: string)
 */
export function BindString(publicName?: string) {
    return (classPrototype: any, propertyName: string) => {
        let bindStringObject = classPrototype[BINDINGS_KEY] || {};
        bindStringObject[propertyName] = '@' + (publicName || '');
        classPrototype[BINDINGS_KEY] = bindStringObject;
    };
}

/**
 * @Require(publicName?: string)
 */
export function Require(ctrlName: string) {
    return (classPrototype: any, propertyName: string) => {
        let requireObject = classPrototype[REQUIRES_KEY] || {};
        requireObject[propertyName] = ctrlName;
        classPrototype[REQUIRES_KEY] = requireObject;
    };
}

/**
 * @Snabb component
 */
export function SnabbComponent() {
    return function (classConstructor: any) {
        return autowireService(classConstructor);
    }
}

/**
 * @Autowired(dep)
 */
export function Autowired(dependency: Injected) {
    // Instance property : target === the prototype of the class
    // Static property : target === class constructor
    return function decoratorFactory(classPrototype: any, decoratedPropertyName: string): void {
        let injectArray: InjectItem[];
        injectArray = classPrototype[AUTOWIRING_ARRAY_KEY];
        if (!injectArray) {
            injectArray = [];
        }
        injectArray.push({
            propertyName: decoratedPropertyName,
            dependency: dependency
        })
        classPrototype[AUTOWIRING_ARRAY_KEY] = injectArray;
    };
}

/**
 * @NgScope
 */
export function NgScope(classPrototype: any, decoratedPropertyName: string): void {
    classPrototype[COMPONENT_SCOPE] = decoratedPropertyName;
}

/**
 * @NgElement
 */
export function NgElement(classPrototype: any, decoratedPropertyName: string): void {
    classPrototype[COMPONENT_ELEMENT] = decoratedPropertyName;
}

/**
 * @NgAttrs
 */
export function NgAttrs(classPrototype: any, decoratedPropertyName: string): void {
    classPrototype[COMPONENT_ATTRS] = decoratedPropertyName;
}

/**
 * @ListenBus(()=>Event or Event[])
 * 
 */
export function ListenBus<T>(getEvents: () => T | T[]) {
    return function (classPrototype: any, decoratedPropertyName: string) {
        let listenBusItems: ListenItem<T>[];
        listenBusItems = classPrototype[LISTENBUS_ARRAY_KEY];
        if (!listenBusItems) {
            listenBusItems = [];
        }
        listenBusItems.push({
            propertyName: decoratedPropertyName,
            getEvents: getEvents
        })
        classPrototype[LISTENBUS_ARRAY_KEY] = listenBusItems;
    }
}

/**
 * @NgEventBus
 * 
 * Annotate event bus class
 */
export function NgEventBus(serviceConstructor: any): void {
    serviceConstructor.prototype[IS_EVENT_BUS] = true;
}

function addBusListenersToComponent<T, U, V>(classConstructor: any): any {
    let overridedConstructor = classConstructor;
    let listenBusItems: ListenItem<T>[] = classConstructor.prototype[LISTENBUS_ARRAY_KEY] || [];

    overridedConstructor = DecoratorUtils.overrideConstructor(classConstructor, function (..._args: any[]) {
        console.debug('___________________________');
        console.debug('Add bus listeners of component', classConstructor.name);
        console.debug('___________________________');
        let sprangEventBus: EventBusListenerManagerProvider<U, V> = $injector.get(eventBusInjectName);
        let listenBusManager = sprangEventBus.getEventBusListenerManager();

        listenBusItems.forEach((listenBusItem: ListenItem<T>) => {
            let events = listenBusItem.getEvents();
            listenBusManager.addEventListener(<any>events, (...args: any[]) => {
                this[listenBusItem.propertyName].apply(this, args);
            })
            let original$onDestroy = this['$onDestroy'];
            this['$onDestroy'] = () => {
                original$onDestroy.apply(this);
                listenBusManager.unsubscribeAll()
            }
        })
    })

    return overridedConstructor;
}


function autowireService(classConstructor: any): any {
    let overridedConstructor = classConstructor;
    let autowiringArray: InjectItem[] = classConstructor.prototype[AUTOWIRING_ARRAY_KEY];
    if (autowiringArray) {
        overridedConstructor = DecoratorUtils.overrideConstructor(classConstructor, function () {
            console.debug('___________________________');
            console.debug('Autowiring of service', classConstructor.name);
            console.debug('___________________________');
            autowiringArray.forEach((injection: InjectItem) => {
                let injectionName: string;
                if (isString(injection.dependency)) {
                    injectionName = injection.dependency;
                } else {
                    injectionName = (<any>injection.dependency)().__sprang_getInjectableName();
                }
                console.debug(injection.propertyName + ' <- ' + injectionName);
                this[injection.propertyName] = $injector.get(injectionName);
            })
        })
    }
    return overridedConstructor;
}

function autowireComponent(classConstructor: any): any {
    let overridedConstructor = classConstructor;
    let autowiringArray: InjectItem[] = classConstructor.prototype[AUTOWIRING_ARRAY_KEY] || [];
    // Ask Angular to inject $element and $scope into component constructor
    overridedConstructor.$inject = ['$element', '$scope', '$attrs'];

    overridedConstructor = DecoratorUtils.overrideConstructor(classConstructor, function (...args: any[]) {
        console.debug('___________________________');
        console.debug('Autowiring of component', classConstructor.name);
        console.debug('___________________________');
        autowiringArray.forEach((injection: InjectItem) => {
            let injectionName: string;
            if (isString(injection.dependency)) {
                injectionName = injection.dependency;
            } else {
                injectionName = (<any>injection.dependency)().__sprang_getInjectableName();
            }
            console.debug(injection.propertyName + ' <- ' + injectionName);
            this[injection.propertyName] = $injector.get(injectionName);
        })
        if (classConstructor.prototype[COMPONENT_ELEMENT]) {
            this[classConstructor.prototype[COMPONENT_ELEMENT]] = args[0];
        }
        if (classConstructor.prototype[COMPONENT_SCOPE]) {
            this[classConstructor.prototype[COMPONENT_SCOPE]] = args[1];
        }
        if (classConstructor.prototype[COMPONENT_ATTRS]) {
            this[classConstructor.prototype[COMPONENT_ATTRS]] = args[2];
        }
    })

    return overridedConstructor;
}

function autowireController(classConstructor: any, name: string): any {
    let overridedConstructor = classConstructor;
    let autowiringArray: InjectItem[] = classConstructor.prototype[AUTOWIRING_ARRAY_KEY] || [];
    // Ask Angular to inject $element and $scope into component constructor
    overridedConstructor.$inject = ['$scope'];

    overridedConstructor.__sprang_getInjectableName = () => {
        return name;
    }

    overridedConstructor = DecoratorUtils.overrideConstructor(classConstructor, function (...args: any[]) {
        console.debug('___________________________');
        console.debug('Autowiring of controller', classConstructor.name);
        console.debug('___________________________');
        autowiringArray.forEach((injection: InjectItem) => {
            let injectionName: string;
            if (isString(injection.dependency)) {
                injectionName = injection.dependency;
            } else {
                injectionName = (<any>injection.dependency)().__sprang_getInjectableName();
            }
            console.debug(injection.propertyName + ' <- ' + injectionName);
            this[injection.propertyName] = $injector.get(injectionName);
        })

        let scope: any = args[0];

        // Controller added in scope as $ctrl
        scope.$ctrl = this;

        // Calls controller $onDestroy when scope destroyed 
        scope.$on('$destroy', () => {
            if (this.$onDestroy) {
                this.$onDestroy();
            }
        });

    })

    return overridedConstructor;
}

export function startAutowiring(injector: ng.auto.IInjectorService) {
    console.debug('Autowiring ready');
    $injector = injector;
}

function addUniqInjectableNameToConstructor(classConstructor: any): string {
    // IE11 doesn't provide classConstructor.name
    let targetName = classConstructor.name ? classConstructor.name : 'serviceX';

    let uniqName = _injectables.has(targetName) ? buildUniqName(targetName) : targetName;

    classConstructor[INJECTION_NAME_KEY] = uniqName;
    classConstructor.__sprang_getInjectableName = () => {
        return uniqName;
    };
    _injectables.add(uniqName);

    return uniqName;
}