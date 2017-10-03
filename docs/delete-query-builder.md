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

This is the most efficient way in terms of performance to delete entities from your database. 
