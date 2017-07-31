# Columns

* What is Entity Column?
* Primary columns
* Column types
    * Column types for `mysql` / `mariadb`
    * Column types for `postgres`
    * Column types for `sqlite` / `websql`
    * Column types for `mssql`
    * Column types for `mongodb`

## What is Entity Column?

Entity is a class that maps into database table (or collection for MongoDB database).
You can create entity by defining a new class and mark with special orm decorator:

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;
    
}
```

This will create following database table:

```shell
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| firstName   | varchar(255) |                            |
| lastName    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+
```

Basic entity consist of columns and relations. 
Each entity **MUST** have a primary column (or ObjectId column if are using MongoDB).

Each entity must be registered in your connection options this way:

```typescript
import {createConnection, Connection} from "typeorm";
import {User} from "./entity/User";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [User]
});
```

Or you can specify the whole directory with all entities inside - and all of them will be loaded:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: ["entity/*.js"]
});
```