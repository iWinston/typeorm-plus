# Insert using Query Builder

You can create `INSERT` queries using `QueryBuilder`.
Examples:

```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .insert()
    .into(User)
    .values([
        { firstName: "Timber", lastName: "Saw" }, 
        { firstName: "Phantom", lastName: "Lancer" }
     ])
    .execute();
```

This is the most efficient in terms of performance way to insert things into your database.
You can also perform bulky insertions this way.
     