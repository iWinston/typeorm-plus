## Naming strategies

NamingStrategy is an interface that defines how auto-generated names for such things like table name, or table column
will be named.

#### Interface

By default `DefaultNamingStrategy` is used.
You can implement your own strategies by creating a new class and implementing `NamingStrategy` interface.
There are three methods you need to implement:

* `tableName(className: string): string`

Gets table name from the class name. `DefaultNamingStrategy` transforms className to a sneak-case.

* `columnName(className: string): string`

Gets column name from the class property. `DefaultNamingStrategy` transforms className to a camelCase.

* `relationName(className: string): string`

Gets relation name from the class property. `DefaultNamingStrategy` transforms className to a camelCase.

#### Example

Lets create a simple naming strategy that will add a "_" before names of tables, columns and relations:

```typescript
export class MyNamingStrategy implements NamingStrategy {


    tableName(className: string) {
        return "_" + className;
    }

    columnName(propertyName: string) {
        return "_" + propertyName;
    }

    relationName(propertyName: string) {
        return "_" + propertyName;
    }

}
```

We also need to specify our new naming strategy on connection manager creation:

```typescript
let connectionManager = new ConnectionManager(new MyNamingStrategy());
```

Now try to run and generate your database schema. New naming strategy should be used.