# Delete using Query Builder

You can create `DELETE` queries using `QueryBuilder`.
Examples:
                                               
```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("id = :id", { id: 1 })
    .execute();
```

This is the most efficient in terms of performance way to delete things from your database. 
