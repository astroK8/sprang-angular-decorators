autobind decorator @Autobind
============================


# Class decorator

```typescript
import { Autobind } from './../decorators-module';

@Autobind
export class X {

    private _myVar;

    constructor() {}

    public method1() {
        this._myVar;
    }

    public method2(v:any) {
        this._myVar=v;
    }

}
```

When method1 or method2 are called "this" will always refer to X class instance.


# Method decorator

```typescript
import { Autobind } from './../decorators-module';

export class X {

    private _myVar;

    constructor() {}

    @Autobind
    public method1() {
        this._myVar;
    }

    public method2(v:any) {
        this._myVar=v;
    }

}
```

When method1 is called "this" will always refer to X class instance.

When method2 is called "this" will depend on the context.