## Connection and connection options

You start using ORM by creating a connection with the database. In this section you will learn about:

* [Connection Manager that contains all connections to the databases](#connection-manager)
* [Working with connections](#working-with-connection)
* [Connection options](#connection-options)
* [How to use connection manager, connections and connection options](#example)

### Connection Manager

Connection manager allows to create a new connections and retrive previously created connections. Also it allows to import
entities and subscribers into specific connection. These are main public methods of the `ConnectionManager`:

* `createConnection(connectionName: string = "default", driver: Driver, options: ConnectionOptions): Connection`

Creates a new connection and registers it in the connection manager. It returns a newly created connection.
New connection will have a given *connection name*. If connection name is not given then "default" will be used as a
 connection name. This name will be used to retrieve this connection later.
*Driver* needs to be specified to understand what kind of database will be used for this connection.
Right now it can be only a `mysql` driver.
*Options* specifies connection options. More about it later.

* `getConnection(connectionName: string = "default"): Connection`

Gets a connection with a given name that was created using `createConnection` method. Connection later can be used to
perform actions on it.
* `importEntities(connectionName: string = "default", entities: Function[]): void`

Imports all given entities and registers them in the connection with a given name.
* `importSubscribers(connectionName: string = "default", subscribers: Function[]): void`

Imports all given subscribers and registers them in the connection with a given name.
* `importEntitiesFromDirectories(connectionName: string = "default", paths: string[]): void`

Imports all entities from the given directories and registers them in the connection with a given name.
Paths is an array of directories from where to import entities.
* `importSubscribersFromDirectories(connectionName: string = "default", paths: string[]): void`

Imports all subscribers from the given directories and registers them in the connection with a given name.
Paths is an array of directories from where to import subscribers.

### Working with Connection

Connection is a database connection to specific database of the specific database management system.
There are several useful methods in the Connection object:

* `connect()`
Opens a new connection with the database.
* `close()`
Closes connection with the database.
* `getEntityManager()`
Gets [EntityManager](entity-manager.md) that is used to execute database operations on any entity
that is registered in this connection.
* `getRepository(entityClass: Function)`
Gets a [repository](repository.md) of the specific entity that provides all functionality
(selects/inserts/updates/deletes) with a table of the given entity class.

### Connection Options

To perform a connection you need to specify a connection options. ConnectionOptions is an interface:

```typescript
export interface ConnectionOptions {

    url?: string; // connection url
    host?: string; // database host
    port?: number; // database host port
    username?: string; // database username
    password?: string; // database password
    database?: string; // database name
    autoSchemaCreate?: boolean; // set to true if you want your database schema to be auto created on each application launch
    logging?: {

        logger?: (message: any, level: string) => void; // some specific logger to be used. By default it is a console
        logQueries?: boolean; // used if you want to log every executed query
        logOnlyFailedQueries?: boolean; // used if you want to log only failed query
        logFailedQueryError?: boolean; // used if you want to log error of the failed query

    };

}
```

* To perform a connection you either must specify a connection `url`, either specify `host/port/username/password/database`.
* `autoSchemaCreate` allows you to automatically synchronize your database schema (create new tables,
remove/rename old columns, create foreign keys, etc.) on each application run. Note that there can be errors in schema
synchronization (mostly errors can be caused by unresolved foreign keys) and this will crash your application.
This option should not be used in production, only during development and only if you are too lazy to use
[command line tools](command-line-tools.md). Alternatively you can use [schema update gulp plugin](todo).


### Example

```typescript
// create a new connection manager
let connectionManager = new ConnectionManager();

// prepare connection options
let connectionOptions: ConnectionOptions = {
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    autoSchemaCreate: true
};

// create a new connection with mysql driver
connectionManager.createConnection(new MysqlDriver(), connectionOptions);

// import all entities from specific directory
connectionManager.importEntitiesFromDirectories(__dirname + "/entities");

// get our connection:
let connection = connectionManager.getConnection();
connection.connect().then(connection => {

    // now we are connected to the database
    // here we have a connection and we can use any of its methods
    // lets say we have a Photo entity in the /entities directory

    // and lets create a new Photo entity instance

    // lets try to use entity manager
    let entityManager = connection.getEntityManager();

    // and lets create a new Photo entity instance
    let photo = new Photo();
    photo.name = "photo #1";

    // and save it using entity manager
    entityManager
        .persist(photo)
        .then(photo => {
            console.log("Photo has been saved using entity manager");
        });

    // lets try to use repository
    let repository = connection.getRepository(Photo);

    // and lets create a new Photo entity instance
    let photo = new Photo();
    photo.name = "photo #2";

    // and save it using repository
    repository
        .persist(photo)
        .then(photo => {
            console.log("Photo has been saved using repository");
        });


}).catch(error => {
    // looks like some error during connection. Lets log it to find details
    console.log("error during connection to the database ", error);
});
```

