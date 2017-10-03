# Update using Query Builder

You can create `UPDATE` queries using `QueryBuilder`.
Examples:
             
```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .update(User)
    .set({ firstName: "Timber", lastName: "Saw" })
    .where("id = :id", { id: 1 })
    .execute();
```

This is the most efficient in terms of performance way to update things in your database.
