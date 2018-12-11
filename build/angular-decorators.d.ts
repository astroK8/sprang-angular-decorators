/// <reference types="angular" />
import { EventEmitter } from './output-event';
declare type InjectFunc = () => Function;
declare type Injected = string | InjectFunc;
interface ComponentOptions extends ng.IComponentOptions {
    selector: string;
}
export declare function setModule(mod: ng.IModule): void;
export declare function getInjectableName(target: any): string;
export { EventEmitter };
/**
 * @Component(options:ComponentOptions)
 */
export declare function Component(options: ComponentOptions): any;
/**
 * @Input(publicName?: string)
 */
export declare function Input(publicName?: string): (classPrototype: any, propertyName: string) => void;
/**
 * @Output(publicName?: string)
 */
export declare function Output(publicName?: string): (classPrototype: any, propertyName: string) => void;
/**
 * @Filter(name:string)
 */
export declare function Filter(name: string): (classConstructor: any) => void;
/**
 * @Service()
 */
export declare function Service(): (serviceConstructor: any) => void;
/**
 * @Controller(name:string)
 */
export declare function Controller(name?: string): (classConstructor: any) => void;
/**
 * @BindString(publicName?: string)
 */
export declare function BindString(publicName?: string): (classPrototype: any, propertyName: string) => void;
/**
 * @Require(publicName?: string)
 */
export declare function Require(ctrlName: string): (classPrototype: any, propertyName: string) => void;
/**
 * @Snabb component
 */
export declare function SnabbComponent(): (classConstructor: any) => any;
/**
 * @Autowired(dep)
 */
export declare function Autowired(dependency: Injected): (classPrototype: any, decoratedPropertyName: string) => void;
/**
 * @NgScope
 */
export declare function NgScope(classPrototype: any, decoratedPropertyName: string): void;
/**
 * @NgElement
 */
export declare function NgElement(classPrototype: any, decoratedPropertyName: string): void;
/**
 * @NgAttrs
 */
export declare function NgAttrs(classPrototype: any, decoratedPropertyName: string): void;
/**
 * @ListenBus(()=>Event or Event[])
 *
 */
export declare function ListenBus<T>(getEvents: () => T | T[]): (classPrototype: any, decoratedPropertyName: string) => void;
/**
 * @NgEventBus
 *
 * Annotate event bus class
 */
export declare function NgEventBus(serviceConstructor: any): void;
export declare function startAutowiring(injector: ng.auto.IInjectorService): void;
