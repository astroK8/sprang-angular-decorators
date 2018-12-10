import { EventBusListenerManager } from "./EventBusListenerManager";

export interface EventBusListenerManagerProvider<U,V> {
    getEventBusListenerManager():EventBusListenerManager<U,V>;
}