# Logging

* Enabling logging
* Logging options
* Log long-running sql queries
* Changing default logger
* Using custom logger

## Enabling logging

You can enable all queries logging by simply setting `logging: true` in your connection options:

```json
{
    "name": "mysql",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test",
    // ...
    "logging": true
}
```

This configuration will enable all executed queries logging and failed query errors.

## Logging options

You can enable different types of logging in connection options:

```json
{ 
    "host": "localhost",
    // ...
    "logging": ["query", "error"]
}
```

If you want to enable only logging of failed queries then only enable `error` in configuration:

```json
{
    "host": "localhost",
    // ...
    "logging": ["error"]
}
```

There are few other options you can use:

* `query` - enables all query logging
* `error` - enables failed query error logging
* `schema` - enables schema build process logging
* `warn` - enables internal orm warning messages logging
* `info` - enables internal orm informative messages logging
* `log` - enables internal orm log messages logging

You can specify as many of logging options as needed. 
If you want to enable all logging you can simply specify `logging: "all"`:

```json
{
    "host": "localhost",
    // ...
    "logging": "all"
}
```

## Log long-running queries

If you have performance issues you can log queries that execute too much time
by setting `maxQueryExecutionTime` option in connection options:

```json
{
    "host": "localhost",
    // ...
    "maxQueryExecutionTime": 1000
}
```

This code will log all queries which run more then `1 second`.

## Changing default logger

There are several loggers TypeORM ships with 3 different types of loggers:

* `advanced-console` - this is default logger which logs all messages into console using color 
and sql syntax highlighting (using [chalk]() package)
* `simple-console` - this is simple console logger which is exactly the same as advanced, but it does not use any color highlighting.
This logger can be used if you have problems / or don't like colorized logs
* `file` - this logger writes all logs into `ormlogs.log` file in the root folder of your project (near `package.json` and `ormconfig.json`)

You can enable any of them in connection options this way:

```json
{
    "host": "localhost",
    // ...
    "logging": true,
    "logger": "file"
}
```

## Using custom logger

You can create your own logger class by implementing `Logger` interface and 
specifying your custom logger in connection options:

```typescript
import {Logger} from "typeorm";

export class MyCustomLogger implements Logger {
    
    // implement all methods from logger class
    
}
```

And specify it in connection options:

```typescript
import {createConnection} from "typeorm";
import {MyCustomLogger} from "./logger/MyCustomLogger";

createConnection({
    name: "mysql",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logger: MyCustomLogger()
});
```

If you defined your connection options in `ormconfig` file,
then you can use it and override following way:

```typescript
import {createConnection, getConnectionOptions} from "typeorm";
import {MyCustomLogger} from "./logger/MyCustomLogger";

// getConnectionOptions will read options from your ormconfig file
// and return it in connectionOptions object
// then you can simply append additional properties to it
getConnectionOptions().then(connectionOptions => {
    return createConnection(Object.assign(connectionOptions, {
        logger: new MyCustomLogger()
    }))
});
```