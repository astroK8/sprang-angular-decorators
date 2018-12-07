sprang-angular-decorators
==================

Angular decorators for angular 1 inspired by [ng-forward](https://github.com/ngUpgraders/ng-forward) and java/spring annotations

# @Autowired

Auto injection of services

```typescript
import { MyService } from './../myService';

export class X {  

    @Autowired(()=>MyService)
    private myService:MyService
    
    @Autowired('$timeout')
  	private $timeout: ng.ITimeoutService;

    constructor(private dependency1, private dependency2) {}  
}
```

Notes:  
  - Angular native services are injected via there name as a string
  - Custom angular services (decorated with @Service) are injected via a function returning corresponding class


# @Service

Registers an angular service

```typescript
@Service()  
export class MyService {}
```


# @Component

Registers an angular component

```typescript
@Component({
    selector:'my-component-selector'  // '[my-component-selector]' for attribute selector
    template?:string,
    templateUrl?:string
    ... // and all other "classic" component config values
})
class MyComponent implements ng.ComponentLifeCycle {
    
    constructor(){}
    
    $onInit() {
    }

    $onChanges(changes:ng.Changes) {

    }

    $doCheck() {
    }

    $onDestroy() {
    }

    $postLink() {
    }
}
```
***Warning !!! $ctrl shall be used in templates => {{$ctrl.x}}*** 

# @Controller

Registers an angular controller

```typescript
@Controller()  
export class MyController {}
```

# @NgElement

Auto injects components HTMLElement 

```typescript
@Controller()  
export class MyComponentOnly {

    @NgElement
    private $element:ng.IAugmentedJQuery;

}
```

# @NgAttrs

Auto injects component attributes (Input or BindString shall be prefered)

```typescript
@Controller()  
export class MyComponentOnly {

    @NgAttrs
    private $Attrs:ng.IAttributes;

}
```

# @NgScope

Auto injects angular scope

```typescript
@Controller()  
export class MyComponentOrController {

    @NgScope
    private scope:ng.IScope;

}
```

# @Input

```typescript
@Component(...)
class X {
    @Input() inputA;
    @Input('customInputB') inputB;

    $onChanges(changes:any) {
        if(changes[inputA].previousValue !== changes[inputA].currentValue) {
            ...
        }
    }
}
```

```html
<elt input-a="scopeVarA" custom-input-b="scopeVarB"></elt>
```

Any modification of scopeVarA and scopeVarB values will be reported respectively on inputA and inputB (but only in this direction)

Modification can be watch via $onChanges lifecycle method

# @Output

```typescript
@Component(...)
@Inject('$element')
class X {

    @Output() outputA = new OutputEmitter('outputA',this);
    @Output('customOutputB') outputB = new OutputEmitter('outputB',this);

    constructor(private $element:ng.IAugmentedJQuery) {}

    ... {
        this.outputA.emit('john');
        this.outputB.emit({name:'doe'})
    }

}
```

```html
<elt (output-a)="handlera($event)" (custom-output-b)="handlerb($event)"></elt>
```

```typescript
scope.handlera=(e)=>{console.log(e)} // -> 'john'
scope.handlerb=(ev)=>{console.log(ev)} // -> {name:'doe'} 
```

***Note: all native events are also available click, mouseover... with (...)="" syntax. e.g: (click)="clickHandler($event)"***

# @BindString

```typescript
@Component(...)
class X {
    @BindString() stringA;
    @BindString('customStringB') stringB;
}
```

```html
<elt string-a="john" custom-string-b="doe"></elt>
```

Will set  

stringA with "john" 
stringB with "doe" 

# @Require

```typescript
@Component(...)
class X {
    Require('ngModel') modelCtrl;
}
```

```html
<elt ng-model="scopeVar"></elt>
```

# @Filter

```typescript
@Filter('filterName')
class X {
  filter(...):any {
    return ...;
  }
}
```

# @SnabbComponent

```typescript
@SnabbComponent
export class SComponentName extends SnabbdomComponent<Props> {
    constructor() {
        super();
    }

    protected view() {
        ...
    }
    ...
}
```

# @NgEventBus

Annotate class that implements event bus

```typescript
@NgEventBus
export class MyBus {
    ...
}
```

# @ListenBus()

```typescript
export class MyComponent {
    ...

    @ListenBus(()=>MyEvent)
    protected myMethod(data:MyEventData) {
        ...
    }
}
```

myMethod will be called each time MyEvent is fired by class annotated with @NgEventBus.
ListenBus decorator will automatically unregister bus listener when component is destroyed.



