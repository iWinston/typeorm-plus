# Connection API

* [Main API](#main-api)
* [`Connection` API](#connection-api)
* [`ConnectionManager` API](#connectionmanager-api)

## Main API

* `createConnection()` - Creates a new connection and registers it in global connection manager.
If connection options parameter is omitted then connection options are read from `ormconfig` file or environment variables.

```typescript
import {createConnection} from "typeorm";

const connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```

* `createConnections()` - Creates multiple connections and registers them in global connection manager.
If connection options parameter is omitted then connection options are read from `ormconfig` file or environment variables.

```typescript
import {createConnections} from "typeorm";

const connection = await createConnections([{
    name: "connection1",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
}, {
    name: "connection2",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
}]);
```

* `getConnectionManager()` - Gets connection manager which stores all created (using `createConnection` method) connections.

```typescript
import {getConnectionManager} from "typeorm";

const defaultConnection = getConnectionManager().get("default");
const secondaryConnection = getConnectionManager().get("secondary");
```

* `getConnection()` - Gets connection which was created by using `createConnection` method.

```typescript
import {getConnection} from "typeorm";

const connection = getConnection();
// if you have named connection you can specify its name:
const secondaryConnection = getConnection("secondary-connection");
```

* `getEntityManager()` - Gets `EntityManager` from connection. 
Connection name can be specified to indicate what connection's entity manager should be taken.

```typescript
import {getEntityManager} from "typeorm";

const manager = getEntityManager();
// you can use manager methods now

const secondaryManager = getEntityManager("secondary-connection");
// you can use secondary connection manager methods
```

* `getRepository()` - Gets some entity's `Repository` from connection. 
Connection name can be specified to indicate what connection's entity manager should be taken.

```typescript
import {getRepository} from "typeorm";

const userRepository = getRepository(User);
// you can use repository methods now

const blogRepository = getRepository(Blog, "secondary-connection");
// you can use secondary connection repository methods
```

* `getTreeRepository()` - Gets some entity's `TreeRepository` from connection. 
Connection name can be specified to indicate what connection's entity manager should be taken.

```typescript
import {getTreeRepository} from "typeorm";

const userRepository = getTreeRepository(User);
// you can use repository methods now

const blogRepository = getTreeRepository(Blog, "secondary-connection");
// you can use secondary connection repository methods
```

* `getMongoRepository()` - Gets some entity's `MongoRepository` from connection. 
Connection name can be specified to indicate what connection's entity manager should be taken.

```typescript
import {getMongoRepository} from "typeorm";

const userRepository = getMongoRepository(User);
// you can use repository methods now

const blogRepository = getMongoRepository(Blog, "secondary-connection");
// you can use secondary connection repository methods
```

## `Connection` API

* `name` - Connection name. If you created nameless connection then its equal to "default".
You use this name when you work with multiple connections and call `getConnection(connectionName: string)`

```typescript
const connectionName: string = connection.name;
```

* `options` - Connection options used to create this connection.
For more information about connection options see [Connection Options](./connection-options.md) documentation.

```typescript
const connectionOptions: ConnectionOptions = connection.options;
// you can cast connectionOptions to MysqlConnectionOptions or any other xxxConnectionOptions depend on database driver you use
```

* `isConnected` - Indicates if real connection to the database is established.

```typescript
const isConnected: boolean = connection.isConnected;
```

* `driver` - Underlying database driver used in this connection.

```typescript
const driver: Driver = connection.driver;
// you can cast connectionOptions to MysqlDriver or any other xxxDriver depend on database driver you use
```

* `manager` - `EntityManager` used to work with connection entities.
For more information about EntityManager see [Entity Manager and Repository](working-with-entity-manager.md) documentation.

```typescript
const manager: EntityManager = connection.manager;
// you can call manager methods, for example find:
const user = await manager.findOneById(1);
```

* `mongoManager` - `MongoEntityManager` used to work with connection entities in mongodb connections.
For more information about MongoEntityManager see [MongoDB](./mongodb.md) documentation.

```typescript
const manager: MongoEntityManager = connection.mongoManager;
// you can call manager or mongodb-manager specific methods, for example find:
const user = await manager.findOneById(1);
```

* `connect` - Performs connection to the database. 
When you use `createConnection` method it automatically calls this method and you usually don't need to call it by yourself.

```typescript
await connection.connect();
```

* `close` - Closes connection with the database. 
Usually you call this method when your application is shutdown.

```typescript
await connection.close();
```

* `synchronize` - Synchronizes database schema. When `synchronize: true` is set in connection options it calls exactly this method. 
Usually you call this method when your application is shutdown.

```typescript
await connection.synchronize();
```

* `dropDatabase` - Drops the database and all its data.
Be careful with this method on production since this method will erase all your database tables and their data.
Can be used only after connection to the database is established.

```typescript
await connection.dropDatabase();
```

* `runMigrations` - Runs all pending migrations.

```typescript
await connection.runMigrations();
```

* `undoLastMigration` - Reverts last executed migration.

```typescript
await connection.undoLastMigration();
```

* `hasMetadata` - Checks if metadata for a given entity is registered.
Learn more about metadata in [Entity Metadata](./entity-metadata.md) documentation.

```typescript
if (connection.hasMetadata(User))
    const userMetadata = connection.getMetadata(User);
```

* `getMetadata` - Gets `EntityMetadata` of the given entity.
You can also specify a table name and if entity metadata with such table name is found it will be returned.
Learn more about metadata in [Entity Metadata](./entity-metadata.md) documentation.

```typescript
const userMetadata = connection.getMetadata(User);
// now you can get any information about User entity
```

* `getRepository` - Gets `Repository` of the given entity.
You can also specify a table name and if repository for given table is found it will be returned.
Learn more about repositories in [Repository](working-with-entity-manager.md) documentation.

```typescript
const repository = connection.getRepository(User);
// now you can call repository methods, for example find:
const users = await repository.findOneById(1);
```

* `getTreeRepository` - Gets `TreeRepository` of the given entity.
You can also specify a table name and if repository for given table is found it will be returned.
Learn more about repositories in [Repository](working-with-entity-manager.md) documentation.

```typescript
const repository = connection.getTreeRepository(Category);
// now you can call tree repository methods, for example findTrees:
const categories = await repository.findTrees();
```

* `getMongoRepository` - Gets `getMongoRepository` of the given entity.
This repository is used for entities in MongoDB connection.
Learn more about mongodb support refer to [MongoDB documentation](./mongodb.md).

```typescript
const repository = connection.getMongoRepository(User);
// now you can call mongodb-specific repository methods, for example createEntityCursor:
const categoryCursor = repository.createEntityCursor();
const category1 = await categoryCursor.next();
const category2 = await categoryCursor.next();
```

* `getCustomRepository` - Gets customly defined repository.
Learn more about custom repositories in [Repository](working-with-entity-manager.md) documentation.

```typescript
const userRepository = connection.getCustomRepository(UserRepository);
// now you can call methods inside your custom repository - UserRepository class
const crazyUsers = await userRepository.findCrazyUsers();
```

* `transaction` - Provides a single transaction where multiple database requests will be executed in a single database transaction.
Learn more about transactions in [Transactions](./transactions.md) documentation.

```typescript
await connection.transaction(async manager => {
    // NOTE: you must perform all database operations using given manager instance
    // its a special instance of EntityManager working with this transaction
    // and don't forget to await things here
});
```

* `query` - Executes a raw SQL query.

```typescript
const rawData = await connection.query(`SELECT * FROM USERS`);
```

* `createQueryBuilder` - Creates a query builder use to build SQL queries.
Learn more about query builder in [QueryBuilder](select-query-builder.md) documentation.

```typescript
const users = await connection.createQueryBuilder()
    .select()
    .from(User, "user")
    .where("user.name = :name", { name: "John" })
    .getMany();
```

* `createQueryRunner` - Creates a query runner used to work with a single real database connection, manage it and work with it.
Learn more about query runners in [QueryRunner](./query-runner.md) documentation. 

```typescript
const queryRunner = connection.createQueryRunner();

// you can use it methods only after you call connect method
// which performs real database connection
await queryRunner.connect();

// .. now you can work with query runner and call its methods

// very important - don't forget to release query runner once you finished working with it
await queryRunner.release();
```

## `ConnectionManager` API

* `create` - Creates a new connection and register it in the manager.

```typescript
const connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```

* `get` - Gets already created connection stored in the manager by its name.

```typescript
const defaultConnection = connectionManager.get("default");
const secondaryConnection = connectionManager.get("secondary");
```

* `has` - Checks if connection is registered in the given connection manager.

```typescript
if (connectionManager.has("default")) {
    // ...
}
```