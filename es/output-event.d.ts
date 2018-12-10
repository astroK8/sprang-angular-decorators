/**
* create an attribute directive directive for each event of the set
*
* <elt (my-custom-event)="f($event,e)"></elt> for event myCustomEvent
*/
export declare function resolveEvents(): void;
export declare function buildEventSelector(name: string): string;
export declare function addEvent(event: string): void;
export declare class EventEmitter<T> {
    private eventName;
    private componentInstance;
    constructor(eventName: string, componentInstance: any);
    emit: ($event?: T | undefined) => void;
}
