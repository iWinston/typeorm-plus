# Connection Options

* What is `ConnectionOptions`
* Common connection options
* `mysql` / `mariadb` connection options
* `postgres` connection options
* `sqlite` / `websql` connection options
* `mssql` connection options
* `mongodb` connection options
* Connection options example
    
## What is `ConnectionOptions` interface

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
for that charset is used. (Default: 'UTF8_GENERAL_CI').

* `timezone` - he timezone configured on the MySQL server. This is used to type cast server date/time 
values to JavaScript Date object and vice versa. This can be 'local', 'Z', or an offset in the form 
+HH:MM or -HH:MM. (Default: 'local')

* `connectTimeout` - The milliseconds before a timeout occurs during the initial connection to the MySQL server.
 (Default: 10000)
 
* `insecureAuth` - Allow connecting to MySQL instances that ask for the old (insecure) authentication method. 
(Default: false)
 
* `supportBigNumbers` - When dealing with big numbers (BIGINT and DECIMAL columns) in the database, 
you should enable this option (Default: false)
 
* `bigNumberStrings` - Enabling both supportBigNumbers and bigNumberStrings forces big numbers 
(BIGINT and DECIMAL columns) to be always returned as JavaScript String objects (Default: false). 
Enabling supportBigNumbers but leaving bigNumberStrings disabled will return big numbers as String 
objects only when they cannot be accurately represented with 
[JavaScript Number objects](http://ecma262-5.com/ELS5_HTML.htm#Section_8.5) 
(which happens when they exceed the [-2^53, +2^53] range), otherwise they will be returned as 
Number objects. This option is ignored if supportBigNumbers is disabled.

* `dateStrings` - Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then 
inflated into JavaScript Date objects. Can be true/false or an array of type names to keep as strings. 
(Default: false)

* `debug` - Prints protocol details to stdout. Can be true/false or an array of packet type names that 
should be printed. (Default: false)

* `trace` - Generates stack traces on Error to include call site of library entrance ("long stack traces"). 
Slight performance penalty for most calls. (Default: true)

* `multipleStatements` - Allow multiple mysql statements per query. Be careful with this, it could increase the scope 
of SQL injection attacks. (Default: false)

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