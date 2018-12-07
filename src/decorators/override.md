trace decorator @Override
============================

```typescript
import { Trace } from './../decorators-module';

export class X {

    @Autobind
    public myMethod() {}

}

export class Y {

    @Override
    public myMethod() {}

}

```

Override decorator will check that:
- X implements myMethod
- If myMethod of X is autobinded, myMethod of Y is automatically autobinded