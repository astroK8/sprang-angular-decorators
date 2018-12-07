trace decorator @Trace
============================


# Class decorator

```typescript
import { Trace } from './../decorators-module';

@Trace
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

Every X instances creation + every call of methods will be logged in the console


# Method decorator

```typescript
import { Trace } from './../decorators-module';

export class X {

    private _myVar;

    constructor() {}

    @Trace
    public method1() {
        this._myVar;
    }

    public method2(v:any) {
        this._myVar=v;
    }

}
```

Every call to method1 will be logged in the console

# Property decorator

```typescript
import { Trace } from './../decorators-module';

export class X {

    @Trace
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

Every modification of _myvar will be logged in the console.