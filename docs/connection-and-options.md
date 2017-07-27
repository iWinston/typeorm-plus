# Connection and connection options

* What is `Connection` in TypeORM
* Creating a new connection
    * Creating a new connection using main api
    * Creating connection using `ConnectionManager`
* Connection options
    * Common connection options
    * Specific options for `mysql` / `mariadb`
    * Specific options for `postgres`
    * Specific options for `sqlite` / `websql`
    * Specific options for `mssql`
    * Specific options for `mongodb`
* Creating a new connection from the configuration files
    * Loading from `ormconfig.json`
    * Loading from `ormconfig.js` or from environment variables
    * Loading from `ormconfig.env`
    * Loading from `ormconfig.yml`
    * Loading from `ormconfig.xml`
* Working with connection
* Connection usage example in sample express application
* Using service container and typedi extensions
* API
    * Main API
    * `Connection` class API
    * `ConnectionManager` class API
    
## What is `Connection` in TypeORM

Connection is a TypeORM class which setups a real connection with your database.
Depend on database type it may also setup a connection pool. 
Connection (or connection pool) setup is made once its `connection` method is called.
Disconnection (or closing all connections in the pool) is made once its `disconnect` method is called.
You must create TypeORM `Connection` only once in your application bootstrap.

## Creating a new connection

### Creating a new connection using main api

There are several ways how connection can be created. 
The most simple and common way is to use main api `createConnection` and `createConnections` methods.

`createConnection` creates a single connection:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
});
```

`createConnections` creates multiple connection:

```typescript
import {createConnections, Connection} from "typeorm";

const connections: Connection[] = await createConnections([{
    name: "default",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
}, {
    name: "test2-connection",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test2",
}]);
```

Both these methods automatically call `Connection#connect` method.
Both these methods automatically load configuration from `ormconfig` file if connection options are not specified.
For example:

```typescript
import {createConnection, Connection} from "typeorm";

// here createConnection will load connection options from
// ormconfig.json / ormconfig.js / ormconfig.yml / ormconfig.env / ormconfig.xml
// files, or from special environment variables
// if ormconfig contains multiple connections then it will load connection named "default" 
// or connection without name at all (which means it will be named "default" by default)
const connection: Connection = await createConnection();

// if createConnections is called instead of createConnection then it will initialize and return all connections
// defined in ormconfig file
```

Different connections must have different connection names.
Different connections cannot have same connection name.
By default, if connection name is not specified it is equal to `default`.
Usually use multiple connections when you have multiple databases or multiple connection configurations.

Once you create a connection you can obtain it anywhere, using `getConnection` method:

```typescript
import {getConnection} from "typeorm";

// can be used once createConnection is called and is resolved
const connection = getConnection();

// if you have multiple connections you can get connection by name:
const secondConnection = getConnection("test2-connection");
```

Avoid creating extra classes / services which store instance of your connections.
This functionality is already embed into TypeORM - 
you don't need to overengineer and create useless abstractions.

### Creating connection using `ConnectionManager`

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

## Creating a new connection from the configuration files

Most of the times you want to store your connection options in a separate configuration file.
It makes it convenient and easy to manage. 
TypeORM supports multiple configuration sources of this purpose.
You'll only need to create `ormconfig.[format]` file in root directory of your application (near `package.json`),
write configuration there and in your app simply call `createConnection()` without any configuration passed:

```typescript
import {createConnection, Connection} from "typeorm";

// createConnection method will automatically read connection options from your ormconfig file
const connection: Connection = await createConnection();
```
 
### Loading from `ormconfig.json`

Create `ormconfig.json` file in root of your project. It should have following content:

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

Create `ormconfig.js` file in root of your project. It should have following content:

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

Create `ormconfig.env` file in root of your project. It should have following content:

```env
TYPEORM_CONNECTION = mysql
TYPEORM_HOST = localhost
TYPEORM_USERNAME = root
TYPEORM_PASSWORD = admin
TYPEORM_PORT = 3000
TYPEORM_LOGGING = true
```

`ormconfig.env` should be used only during development.
On production you can set all these values in real ENVIRONMENT VARIABLES.

You cannot define multiple connections using `env` file or environment variables.
If your app has multiple connections then use alternative configuration storage format.
