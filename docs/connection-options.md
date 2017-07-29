# Connection Options

* [What is `ConnectionOptions`](#what-is-connectionoptions)
* [Common connection options](#common-connection-options)
* [`mysql` / `mariadb` connection options](#mysql--mariadb-connection-options)
* [`postgres` connection options](#postgres-connection-options)
* [`sqlite` / `websql` connection options](#sqlite--websql-connection-options)
* [`mssql` connection options](#mssql-connection-options)
* [`mongodb` connection options](#mongodb-connection-options)
* [Connection options example](#connection-options-example)
    
## What is `ConnectionOptions`

Connection options is a connection configuration object you pass to `createConnection` method
 or create in `ormconfig` file. Different drivers have their own specific connection options.

## Common connection options

* `type` - Database type. You must specify what database engine you use.
 Possible values are "mysql", "postgres", "mariadb", "sqlite", "oracle", "mssql", "websql", "mongodb". 
 This option is required.

* `name` - Connection name. You'll use it to get connection you need using `getConnection(name: string)` 
or `ConnectionManager.get(name: string)` methods. 
Connection names for different connections cannot be same - they all must be unique.
If connection name is not given then it will be called "default".

* `extra` - Extra connection options to be passed to the underlying driver. 
Use it if you want to pass extra settings to underlying database driver.

* `entities` - Entities to be loaded and used for this connection.
Accepts both entity classes and directories where from they must to be loaded.
Directories support glob patterns.
Example: `entities: [Post, Category, "entity/*.js", "modules/**/entity/*.js"]`.
For more information about entities refer to [Entities](./entities.md) documentation.

* `subscribers` - Subscribers to be loaded and used for this connection.
Accepts both entity classes and directories where from they must to be loaded.
Directories support glob patterns.
Example: `subscribers: [PostSubscriber, AppSubscriber, "subscriber/*.js", "modules/**/subscriber/*.js"]`.
For more information about subscribers refer to [Subscribers](./subscribers-and-listeners.md) documentation.

* `entitySchemas` - Entity schemas to be loaded and used for this connection.
Accepts both entity schema classes and directories where from they must to be loaded.
Directories support glob patterns.
Example: `entitySchemas: [PostSchema, CategorySchema, "entity-schema/*.json", "modules/**/entity-schema/*.json"]`.
For more information about subscribers refer to [Entity Schemas](./schema-in-files.md) documentation.

* `migrations` - Migrations to be loaded and used for this connection.
Accepts both migration classes and directories where from they must to be loaded.
Directories support glob patterns.
Example: `migrations: [FirstMigration, SecondMigration, "migration/*.js", "modules/**/migration/*.js"]`.
For more information about migrations refer to [Migrations](./migrations.md) documentation.

* `logging` - Indicates if logging is enabled or not. 
If set to `true` then query and error logging will be enabled.
You can also specify different types of logging to be enabled, for example `["query", "error", "schema"]`.
For more information about logging refer to [Logging](./logging.md) documentation.

* `logger` - Logger to be used for logging purposes. Possible values are "advanced-console", "simple-console" and "file". 
Default is "advanced-console". You can also specify a logger class that implements `Logger` interface.
For more information about logging refer to [Logging](./logging.md) documentation.

* `maxQueryExecutionTime` - If query execution time exceed this given max execution time (in milliseconds)
then logger will log this query.

* `namingStrategy` - Naming strategy to be used to name tables and columns in the database.
Refer to [Naming strategy](./naming-strategy.md) documentation for more information.

* `entityPrefix` - Prefixes with the given string all tables (or collections) on this database connection.

* `dropSchema` - Drops the schema each time connection is being established.
Be careful with this option and don't use this in production - otherwise you'll loose all production data.
This option is useful during debug and development.

* `synchronize` - Indicates if database schema should be auto created on every application launch.
 Be careful with this option and don't use this in production - otherwise you can loose production data.
 This option is useful during debug and development.
 Alternative to it, you can use CLI and run schema:sync command.
 Note that for MongoDB database it does not create schema, because MongoDB is schemaless.
 Instead, it syncs just by creating indices.

* `migrationsRun` - Indicates if migrations should be auto run on every application launch.
Alternative to it, you can use CLI and run migrations:run command.

* `cli.entitiesDir` - Directory where entities should be created by default by CLI.

* `cli.migrationsDir` - Directory where migrations should be created by default by CLI.

* `cli.subscribersDir` - Directory where subscribers should be created by default by CLI.

## `mysql` / `mariadb` connection options

* `url` - Connection url where perform connection to.

* `host` - Database host.

* `port` - Database host port. Default mysql port is `3306`.

* `username` - Database username.

* `password` - Database password.

* `database` - Database name.

* `charset` - The charset for the connection. This is called "collation" in the SQL-level of MySQL 
(like utf8_general_ci). If a SQL-level charset is specified (like utf8mb4) then the default collation 
for that charset is used. (Default: `UTF8_GENERAL_CI`).

* `timezone` - he timezone configured on the MySQL server. This is used to type cast server date/time 
values to JavaScript Date object and vice versa. This can be `local`, `Z`, or an offset in the form 
`+HH:MM` or `-HH:MM`. (Default: `local`)

* `connectTimeout` - The milliseconds before a timeout occurs during the initial connection to the MySQL server.
 (Default: `10000`)
 
* `insecureAuth` - Allow connecting to MySQL instances that ask for the old (insecure) authentication method. 
(Default: `false`)
 
* `supportBigNumbers` - When dealing with big numbers (`BIGINT` and `DECIMAL` columns) in the database, 
you should enable this option (Default: `false`)
 
* `bigNumberStrings` - Enabling both `supportBigNumbers` and `bigNumberStrings` forces big numbers 
(`BIGINT` and `DECIMAL` columns) to be always returned as JavaScript String objects (Default: `false`). 
Enabling `supportBigNumbers` but leaving `bigNumberStrings` disabled will return big numbers as String 
objects only when they cannot be accurately represented with 
[JavaScript Number objects](http://ecma262-5.com/ELS5_HTML.htm#Section_8.5) 
(which happens when they exceed the `[-2^53, +2^53]` range), otherwise they will be returned as 
Number objects. This option is ignored if `supportBigNumbers` is disabled.

* `dateStrings` - Force date types (`TIMESTAMP`, `DATETIME`, `DATE`) to be returned as strings rather then 
inflated into JavaScript Date objects. Can be true/false or an array of type names to keep as strings. 
(Default: `false`)

* `debug` - Prints protocol details to stdout. Can be true/false or an array of packet type names that 
should be printed. (Default: `false`)

* `trace` - Generates stack traces on Error to include call site of library entrance ("long stack traces"). 
Slight performance penalty for most calls. (Default: `true`)

* `multipleStatements` - Allow multiple mysql statements per query. Be careful with this, it could increase the scope 
of SQL injection attacks. (Default: `false`)

* `flags` - List of connection flags to use other than the default ones. It is also possible to blacklist default ones.
 For more information, check [Connection Flags](https://github.com/mysqljs/mysql#connection-flags).
 
* `ssl` -  object with ssl parameters or a string containing name of ssl profile. 
See [SSL options](https://github.com/mysqljs/mysql#ssl-options).

## `postgres` connection options

* `url` - Connection url where perform connection to.

* `host` - Database host.

* `port` - Database host port. Default mysql port is `5432`.

* `username` - Database username.

* `password` - Database password.

* `database` - Database name.

* `schema` - Schema name. Default is "public".

* `ssl` - Object with ssl parameters.

## `sqlite` / `websql` connection options

* `database` - Database path. For example "./mydb.sql"

## `mssql` connection options

* `url` - Connection url where perform connection to.

* `host` - Database host.

* `port` - Database host port. Default mssql port is `1433`.

* `username` - Database username.

* `password` - Database password.

* `database` - Database name.

* `schema` - Schema name. Default is "public".

* `domain` - Once you set domain, driver will connect to SQL Server using domain login.

* `connectionTimeout` - Connection timeout in ms (default: `15000`).

* `requestTimeout` - Request timeout in ms (default: `15000`). NOTE: msnodesqlv8 driver doesn't support
 timeouts < 1 second.

* `stream` - Stream recordsets/rows instead of returning them all at once as an argument of callback (default: `false`).
 You can also enable streaming for each request independently (`request.stream = true`). Always set to `true` if you plan to
 work with large amount of rows.
 
* `pool.max` - The maximum number of connections there can be in the pool (default: `10`).

* `pool.min` - The minimum of connections there can be in the pool (default: `0`).

* `pool.maxWaitingClients` - maximum number of queued requests allowed, additional acquire calls will be callback with
 an err in a future cycle of the event loop.
 
* `pool.testOnBorrow` -  should the pool validate resources before giving them to clients. Requires that either
  `factory.validate` or `factory.validateAsync` to be specified.
  
* `pool.acquireTimeoutMillis` - max milliseconds an `acquire` call will wait for a resource before timing out.
 (default no limit), if supplied should non-zero positive integer.
 
* `pool.fifo` - if true the oldest resources will be first to be allocated. If false the most recently released resources
 will be the first to be allocated. This in effect turns the pool's behaviour from a queue into a stack. boolean,
 (default `true`)
 
* `pool.priorityRange` - int between 1 and x - if set, borrowers can specify their relative priority in the queue if no
 resources are available. see example. (default `1`)
 
* `pool.autostart` - boolean, should the pool start creating resources etc once the constructor is called, (default `true`)

* `pool.victionRunIntervalMillis` - How often to run eviction checks. Default: `0` (does not run).

* `pool.numTestsPerRun` - Number of resources to check each eviction run. Default: `3`.

* `pool.softIdleTimeoutMillis` - amount of time an object may sit idle in the pool before it is eligible for eviction by
 the idle object evictor (if any), with the extra condition that at least "min idle" object instances remain in the pool.
 Default `-1` (nothing can get evicted).
 
* `pool.idleTimeoutMillis` -  the minimum amount of time that an object may sit idle in the pool before it is eligible for
 eviction due to idle time. Supercedes `softIdleTimeoutMillis`. Default: `30000`.
 
* `options.fallbackToDefaultDb` - By default, if the database requestion by `options.database` cannot be accessed, the connection
 will fail with an error. However, if `options.fallbackToDefaultDb` is set to `true`, then the user's default database will
  be used instead (Default: `false`).
  
* `options.enableAnsiNullDefault` - If true, SET ANSI_NULL_DFLT_ON ON will be set in the initial sql. This means new
 columns will be nullable by default. See the [T-SQL documentation](https://msdn.microsoft.com/en-us/library/ms187375.aspx)
 for more details. (Default: `true`).
 
* `options.cancelTimeout` - The number of milliseconds before the cancel (abort) of a request is considered failed (default: `5000`).

* `options.packetSize` - The size of TDS packets (subject to negotiation with the server). Should be a power of 2. (default: `4096`).

* `options.useUTC` - A boolean determining whether to pass time values in UTC or local time. (default: `true`).

* `options.abortTransactionOnError` - A boolean determining whether to rollback a transaction automatically if any
 error is encountered during the given transaction's execution. This sets the value for `SET XACT_ABORT` during the
 initial SQL phase of a connection ([documentation](http://msdn.microsoft.com/en-us/library/ms188792.aspx)).

* `options.localAddress` - A string indicating which network interface (ip addres) to use when connecting to SQL Server.

* `options.useColumnNames` - A boolean determining whether to return rows as arrays or key-value collections. (default: `false`).

* `options.camelCaseColumns` - A boolean, controlling whether the column names returned will have the first letter
 converted to lower case (`true`) or not. This value is ignored if you provide a `columnNameReplacer`. (default: `false`).

* `options.isolationLevel` - The default isolation level that transactions will be run with. The isolation levels are
 available from `require('tedious').ISOLATION_LEVEL`. (default: `READ_COMMITTED`).
 - `READ_UNCOMMITTED`
 - `READ_COMMITTED`
 - `REPEATABLE_READ`
 - `SERIALIZABLE`
 - `SNAPSHOT`
 
* `options.connectionIsolationLevel` - The default isolation level for new connections. All out-of-transaction queries
 are executed with this setting. The isolation levels are available from `require('tedious').ISOLATION_LEVEL`.
 (default: `READ_COMMITTED`).
 - `READ_UNCOMMITTED`
 - `READ_COMMITTED`
 - `REPEATABLE_READ`
 - `SERIALIZABLE`
 - `SNAPSHOT`
 
* `options.readOnlyIntent` - A boolean, determining whether the connection will request read only access from a
 SQL Server Availability Group. For more information, see here. (default: `false`).

* `options.encrypt` - A boolean determining whether or not the connection will be encrypted. Set to true if you're
 on Windows Azure. (default: `false`).
 
* `options.cryptoCredentialsDetails` - When encryption is used, an object may be supplied that will be used for the
 first argument when calling [tls.createSecurePair](http://nodejs.org/docs/latest/api/tls.html#tls_tls_createsecurepair_credentials_isserver_requestcert_rejectunauthorized)
  (default: `{}`).
  
* `options.rowCollectionOnDone` - A boolean, that when true will expose received rows in Requests' `done*` events.
 See done, [doneInProc](http://tediousjs.github.io/tedious/api-request.html#event_doneInProc)
 and [doneProc](http://tediousjs.github.io/tedious/api-request.html#event_doneProc). (default: `false`)
 Caution: If many row are received, enabling this option could result in excessive memory usage.

* `options.rowCollectionOnRequestCompletion` - A boolean, that when true will expose received rows
 in Requests' completion callback. See [new Request](http://tediousjs.github.io/tedious/api-request.html#function_newRequest). (default: `false`)

 Caution: If many row are received, enabling this option could result in excessive memory usage.

* `options.tdsVersion` - The version of TDS to use. If server doesn't support specified version, negotiated version
 is used instead. The versions are available from `require('tedious').TDS_VERSION`. (default: `7_4`).
 - `7_1`
 - `7_2`
 - `7_3_A`
 - `7_3_B`
 - `7_4`

* `options.debug.packet` - A boolean, controlling whether `debug` events will be emitted with text describing packet
 details (default: `false`).
 
* `options.debug.data` - A boolean, controlling whether `debug` events will be emitted with text describing packet data
 details (default: `false`).
 
* `options.debug.payload` - A boolean, controlling whether `debug` events will be emitted with text describing packet
 payload details (default: `false`).
 
* `options.debug.token` - A boolean, controlling whether `debug` events will be emitted with text describing token stream
 tokens (default: `false`).

## `mongodb` connection options

* `url` - Connection url where perform connection to.

* `host` - Database host.

* `port` - Database host port. Default mongodb port is `27017`.

* `database` - Database name.

## Connection options example

Here is small example of connection options for mysql:

```typescript
{
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logging: true,
    synchronize: true,
    entities: [
        "entity/*.js"
    ],
    subscribers: [
        "subscriber/*.js"
    ],
    entitySchemas: [
        "schema/*.json"
    ],
    migrations: [
        "migration/*.js"
    ],
    cli: {
        entitiesDir: "entity",
        migrationsDir: "migration",
        subscribersDir: "subscriber"
    }
}
```