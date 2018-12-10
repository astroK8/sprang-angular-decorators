export interface EventBusListenerManager <U,V> {
    addEventListener(e: U, handler: Function, parameters?: V): void;
    addEventListener(e: U[], handler: Function, parameters?: V): void;
    addEventListener(e: any, handler: Function, parameters?: V): void;
    unsubscribeAll():void;
}