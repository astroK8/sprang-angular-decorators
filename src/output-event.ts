import { Component, NgElement, NgScope, Autowired, NgAttrs } from './sprang-angular-decorators';

let events = new Set([
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

  events.forEach(event => {
    const selector = buildEventSelector(event);
    @Component({
      selector: '[' + selector + ']'
    })
    class EventHandler implements ng.IController {

      @NgElement
      private $element: JQuery;

      @NgScope
      private $scope: ng.IScope;

      @NgAttrs
      private $attrs: ng.IAttributes;

      @Autowired('$parse')
      private $parse: ng.IParseService;

      private expression: any;

      constructor() { }

      public $onInit() {
        this.expression = this.$parse(this.$attrs[selector]);
      }

      public $postLink() {
        this.$element.on(event, (e) => this.eventHandler(e));
      }

      public $onDestroy() {
        this.$element.off(event);
      }

      public $onChanges(_changes: any) { }

      public $doCheck() { }

      public emit($event?: any) {
        this.eventHandler($event);
      }

      public eventHandler($event: any = {}) {

        if ($event.detail && $event.detail._output !== undefined) {
          $event = $event.detail._output;
        }

        if ($event.originalEvent && $event.originalEvent.detail && $event.originalEvent.detail._output) {
          $event = $event.detail._output;
        }

        this.$scope.$evalAsync(() => {
          this.expression(this.$scope, { $event });
        });
      }
      
    }

    (<any>window).removeTSCWarn = new EventHandler();
    (<any>window).removeTSCWarn = null;
  });
}

export function buildEventSelector(name: string) {
  return '(' + name + ')';
}

export function addEvent(event: string) {
  events.add(event);
}

// Calls emit only if attribute for event  ( (event)="..." ) is set on html element
export class EventEmitter<T> {
  constructor(private eventName: string, private componentInstance: any) { }
  emit = ($event?: T) => {
    let eventEmitter = this.componentInstance['_' + this.eventName];
    if (eventEmitter) {
      eventEmitter.emit($event);
    }
  }
}

