# Working with Connection

* [What is `Connection`](#what-is-connection)
* [Creating a new connection](#creating-a-new-connection)
* [Creating a new connection from the configuration file](#creating-a-new-connection-from-the-configuration-file)
    * [Loading from `ormconfig.json`](#loading-from-ormconfigjson)
    * [Loading from `ormconfig.js`](#loading-from-ormconfigjs)
    * [Loading from `ormconfig.env` or from environment variables](#loading-from-ormconfigenv-or-from-environment-variables)
    * [Loading from `ormconfig.yml`](#loading-from-ormconfigyml)
    * [Loading from `ormconfig.xml`](#loading-from-ormconfigxml)
* [Using `ConnectionManager`](#using-connectionmanager)
* [Working with connection](#working-with-connection-1)
* [API](#api)
    * [Main API](#main-api)
    * [`Connection` API](#connection-api)
    * [`ConnectionManager` API](#connectionmanager-api)
    
## What is `Connection`

Connection setups a real connection with your database.
Depend on database type it may also setup a connection pool. 
Connection (or connection pool) setup is made when `connect` method is called.
Disconnection (or closing all connections in the pool) is made when `close` method is called.
Generally, you must create connection only once in your application bootstrap,
and close it after you completely finished working with database.

## Creating a new connection

There are several ways how connection can be created. 
The most simple and common way is to use `createConnection` and `createConnections` methods.

* `createConnection` creates a single connection:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```

* `createConnections` creates multiple connections:

```typescript
import {createConnections, Connection} from "typeorm";

const connections: Connection[] = await createConnections([{
    name: "default",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
}, {
    name: "test2-connection",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test2"
}]);
```

Both these methods automatically call `Connection#connect` method.

Both these methods automatically load configuration from `ormconfig` file if connection options not specified.
For example:

```typescript
import {createConnection, Connection} from "typeorm";

// here createConnection will load connection options from
// ormconfig.json / ormconfig.js / ormconfig.yml / ormconfig.env / ormconfig.xml
// files, or from special environment variables
// if ormconfig contains multiple connections then it will load connection named "default" 
// or connection without name at all (which means it will be named "default" by default)
const connection: Connection = await createConnection();

// if createConnections is called instead of createConnection then 
// it will initialize and return all connections defined in ormconfig file
```

Different connections must have different names.
By default, if connection name is not specified it's equal to `default`.
Usually you use multiple connections when you have multiple databases or multiple connection configurations.

Once you create a connection you can obtain it anywhere from your app, using `getConnection` method:

```typescript
import {getConnection} from "typeorm";

// can be used once createConnection is called and is resolved
const connection = getConnection();

// if you have multiple connections you can get connection by name:
const secondConnection = getConnection("test2-connection");
```

Avoid creating extra classes / services to store and manager your connections.
This functionality is already embed into TypeORM - 
you don't need to overengineer and create useless abstractions.

## Creating a new connection from the configuration file

Most of the times you want to store your connection options in a separate configuration file.
It makes it convenient and easy to manage. 
TypeORM supports multiple configuration sources for this purpose.
You'll only need to create `ormconfig.[format]` file in root directory of your application (near `package.json`),
put your configuration there and in app call `createConnection()` without any configuration passed:

```typescript
import {createConnection, Connection} from "typeorm";

// createConnection method will automatically read connection options from your ormconfig file
const connection: Connection = await createConnection();
```
 
### Loading from `ormconfig.json`

Create `ormconfig.json` file in project root (near `package.json`). It should have following content:

```json
{
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}
```

You can specify any other options from `ConnectionOptions`.
For more information about connection options see [ConnectionOptions](./connection-options.md) documentation.

If you want to create multiple connections then simply create multiple connections in a single array:

```json
[{
   "name": "default",
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}, {
   "name": "second-connection",
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}]
```

### Loading from `ormconfig.js`

Create `ormconfig.js` file in project root (near `package.json`). It should have following content:

```javascript
module.exports = {
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}
```

You can specify any other options from `ConnectionOptions`.
If you want to create multiple connections then simply create multiple connections in a single array and return it.

### Loading from `ormconfig.env` or from environment variables

Create `ormconfig.env` file in project root (near `package.json`). It should have following content:

```ini
TYPEORM_CONNECTION = mysql
TYPEORM_HOST = localhost
TYPEORM_USERNAME = root
TYPEORM_PASSWORD = admin
TYPEORM_PORT = 3000
TYPEORM_SYNCHRONIZE = true
TYPEORM_LOGGING = true
TYPEORM_ENTITIES = entity/.*js,modules/**/entity/.*js
```

List of available env variables you can set:

* TYPEORM_CONNECTION
* TYPEORM_HOST
* TYPEORM_USERNAME
* TYPEORM_PASSWORD
* TYPEORM_PORT
* TYPEORM_SYNCHRONIZE
* TYPEORM_URL
* TYPEORM_SID
* TYPEORM_ENTITIES
* TYPEORM_MIGRATIONS
* TYPEORM_SUBSCRIBERS
* TYPEORM_ENTITY_SCHEMAS
* TYPEORM_LOGGING
* TYPEORM_ENTITIES_DIR
* TYPEORM_MIGRATIONS_DIR
* TYPEORM_SUBSCRIBERS_DIR
* TYPEORM_DRIVER_EXTRA

`ormconfig.env` should be used only during development.
On production you can set all these values in real ENVIRONMENT VARIABLES.

You cannot define multiple connections using `env` file or environment variables.
If your app has multiple connections then use alternative configuration storage format.

### Loading from `ormconfig.yml`

Create `ormconfig.yml` file in project root (near `package.json`). It should have following content:

```yaml
default: # default connection
    host: "localhost"
    port: 3306
    username: "test"
    password: "test"
    database: "test"
    
second-connection: # other connection
    host: "localhost"
    port: 3306
    username: "test"
    password: "test"
    database: "test2"
```

You can use any connection options available.

### Loading from `ormconfig.xml`

Create `ormconfig.xml` file in project root (near `package.json`). It should have following content:

```xml
<connections>
    <connection type="mysql" name="default">
        <host>localhost</host>
        <username>root</username>
        <password>admin</password>
        <database>test</database>
        <port>3000</port>
        <logging>true</logging>
    </connection>
    <connection type="mysql" name="second-connection">
        <host>localhost</host>
        <username>root</username>
        <password>admin</password>
        <database>test2</database>
        <port>3000</port>
        <logging>true</logging>
    </connection>
</connections>
```

You can use any connection options available.

## Using `ConnectionManager`

You can create connection using `ConnectionManager` class. For example:

```typescript
import {getConnectionManager, ConnectionManager, Connection} from "typeorm";

const connectionManager: ConnectionManager = getConnectionManager(); // or you can initialize your own connection manager like this: new ConnectionManager()
const connection: Connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
});
await connection.connect(); // performs connection
```

This is not general way of creating connection, but it may be useful for some users.
For example users who want to create connection and store its instance, 
but have a control when actual "connection" will be established.
Also you can create and maintain your own `ConnectionManager`:

```typescript
import {getConnectionManager, ConnectionManager, Connection} from "typeorm";

const connectionManager = new ConnectionManager(); // or you can initialize your own connection manager like this: new ConnectionManager()
const connection: Connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
});
await connection.connect(); // performs connection
```

But note, this way you won't be able to use `getConnection()` method anymore - 
you'll need to store your connection manager instance and use `connectionManager.get` method to get a connection you need.

Generally avoid this method and avoid unnecessary complications in your application,
use `ConnectionManager` only if you really think you need it.

## Working with connection

Once you setup connection you can use it anywhere in your app using `getConnection` method.
For example:

```typescript
import {getConnection} from "typeorm";
import {User} from "../entity/User";

export class UserController {
    
    @Get("/users")
    getAll() {
        return getConnection().manager.find(User);
    }
    
}
```

You can also use `ConnectionManager#get` method to get a connection,
but using `getConnection()` method is enough in most cases.

Using connection you work with your entities, particularly using `EntityManager` and `Repository`.
For more information about them see [Entity Manager and Repository](./entity-manager-and-repository.md) documentation.

But generally, you don't use `Connection` so much. 
Most of the times you only create a connection.
There are `getRepository()` and `getManager()` functions
you can access your connection's manager and repositories without directly using connection object.
For example:

```typescript
import {getManager, getRepository} from "typeorm";
import {User} from "../entity/User";

export class UserController {
    
    @Get("/users")
    getAll() {
        return getManager().find(User);
    }
    
    @Get("/users/:id")
    getAll(@Param("id") userId: number) {
        return getRepository(User).findOneById(User);
    }
    
}
```

## API

### Main API

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

### `Connection` API

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
For more information about EntityManager see [Entity Manager and Repository](./entity-manager-and-repository.md) documentation.

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
Learn more about repositories in [Repository](./entity-manager-and-repository.md) documentation.

```typescript
const repository = connection.getRepository(User);
// now you can call repository methods, for example find:
const users = await repository.findOneById(1);
```

* `getTreeRepository` - Gets `TreeRepository` of the given entity.
You can also specify a table name and if repository for given table is found it will be returned.
Learn more about repositories in [Repository](./entity-manager-and-repository.md) documentation.

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
Learn more about custom repositories in [Repository](./entity-manager-and-repository.md) documentation.

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

* `query` - Executes given raw SQL query.

```typescript
const rawData = await connection.query(`SELECT * FROM USERS`);
```

* `createQueryBuilder` - Creates a query builder use to build SQL queries.
Learn more about query builder in [QueryBuilder](./query-builder.md) documentation.

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

### `ConnectionManager` API

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