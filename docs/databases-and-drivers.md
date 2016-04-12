## Databases and drivers

ORM is working with databases. To communicate with database it uses **database drivers**.
Database Driver communicates with specific database and performs queries you need.

### Driver Interface

Right now only `mysql` database driver is supported. If you need other driver, or you simply
want to contribute then feel free to add it - adding new drivers is not complicated.

Drivers are typically used within connection:

`let connection = connectionManager.createConnection("my-connection", new MysqlDriver());`

To access the driver you can do it from your connection instance:

`connection.driver`

There are several useful methods in the driver object:

* `driver.native`

Allows you to access a native layer of the driver. For example MysqlDriver is depend of npm's `mysql` package
and `mysqlDriver.native` will give you instance to that package.

* `driver.nativeConnection`

Allows you to access to a connection instance of the native layer of the driver. For example MysqlDriver is depend of
npm's `mysql` package and when we create a connection using that package it returns us some `connection instance` that
 we save in the driver.nativeConnection.

Both methods are not recommended to use, but sometimes you have no choice because of the limits of the ORM abstraction
and you have to use them. In such situations both methods are very useful.

There are lot of other methods in the Driver, but you won't use them directly - they are used by other components, like
[Entity Manager](entity-manager.md) or [Repository](repository.md). You should use those components instead.
