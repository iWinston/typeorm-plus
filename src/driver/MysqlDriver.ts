import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {MysqlSchemaBuilder} from "../schema-builder/MysqlSchemaBuilder";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {BaseDriver} from "./BaseDriver";
import {DriverOptions} from "./DriverOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {DatabaseConnection} from "./DatabaseConnection";
import {DriverPackageNotInstalledError} from "./error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "./error/DriverPackageLoadError";
import {DriverUtils} from "./DriverUtils";

/**
 * This driver organizes work with mysql database.
 */
export class MysqlDriver extends BaseDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    connectionOptions: DriverOptions;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Mysql library.
     */
    protected mysql: any;

    /**
     * Connection to mysql database.
     */
    protected databaseConnection: DatabaseConnection|undefined;

    /**
     * Mysql pool.
     */
    protected pool: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnectionPool: DatabaseConnection[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOptions: DriverOptions,
                mysql?: any) {
        super();

        this.connectionOptions = DriverUtils.buildDriverOptions(connectionOptions);
        this.mysql = mysql;

        // validate options to make sure everything is set
        DriverUtils.validateDriverOptions(this.connectionOptions);

        // if mysql package instance was not set explicitly then try to load it
        if (!mysql)
            this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Database name to which this connection is made.
     */
    get databaseName(): string {
        return this.connectionOptions.database as string;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return columnName; // "`" + columnName + "`";
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return aliasName; // "`" + aliasName + "`";
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return tableName; // "`" + tableName + "`";
    }

    /**
     * Retrieves a new database connection.
     * If pooling is enabled then connection from the pool will be retrieved.
     * Otherwise active connection will be returned.
     */
    retrieveDatabaseConnection(): Promise<DatabaseConnection> {
        if (this.pool) {
            return new Promise((ok, fail) => {
                this.pool.getConnection((err: any, connection: any) => {
                    if (err) {
                        fail(err);
                        return;
                    }

                    let dbConnection = this.databaseConnectionPool.find(dbConnection => dbConnection.connection === connection);
                    if (!dbConnection) {
                        dbConnection = {
                            id: this.databaseConnectionPool.length,
                            connection: connection,
                            isTransactionActive: false
                        };
                        this.databaseConnectionPool.push(dbConnection);
                    }
                    ok(dbConnection);
                });
            });
        }

        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        throw new ConnectionIsNotSetError("mysql");
    }

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     */
    releaseDatabaseConnection(dbConnection: DatabaseConnection): Promise<void> {
        if (this.pool) {
            dbConnection.connection.release();
            this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
        }

        return Promise.resolve();
    }

    /**
     * Creates a schema builder which can be used to build database/table schemas.
     */
    createSchemaBuilder(dbConnection: DatabaseConnection): SchemaBuilder {
        return new MysqlSchemaBuilder(this, dbConnection);
    }

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void> {

        // build connection options for the driver
        const options = Object.assign({}, {
            host: this.connectionOptions.host,
            user: this.connectionOptions.username,
            password: this.connectionOptions.password,
            database: this.connectionOptions.database,
            port: this.connectionOptions.port
        }, this.connectionOptions.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        if (this.connectionOptions.usePool === undefined || this.connectionOptions.usePool === true) {
            this.pool = this.mysql.createPool(options);
            return Promise.resolve();

        } else {
            return new Promise<void>((ok, fail) => {
                this.databaseConnection = {
                    id: 1,
                    connection: this.mysql.createConnection(options),
                    isTransactionActive: false
                };
                this.databaseConnection.connection.connect((err: any) => err ? fail(err) : ok());
            });
        }
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            // if pooling is used, then disconnect from it
            if (this.pool) {
                this.pool.end(handler);
                this.pool = undefined;
                this.databaseConnectionPool = [];
            }

            // if single connection is opened, then close it
            if (this.databaseConnection) {
                this.databaseConnection.connection.end(handler);
                this.databaseConnection = undefined;
            }
        });
    }

    /**
     * Executes a given SQL query.
     */
    query(dbConnection: DatabaseConnection, query: string, parameters?: any[]): Promise<any> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        this.logQuery(query);
        return new Promise((ok, fail) => {
            dbConnection.connection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logFailedQuery(query);
                    this.logQueryError(err);
                    return fail(err);
                }

                ok(result);
            });
        });
    }

    /**
     * Starts transaction.
     */
    async beginTransaction(dbConnection: DatabaseConnection): Promise<void> {
        if (dbConnection.isTransactionActive)
            throw new Error(`Transaction already started for the given connection, commit current transaction before starting a new one.`);

        await this.query(dbConnection, "START TRANSACTION");
        dbConnection.isTransactionActive = true;
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(dbConnection: DatabaseConnection): Promise<void> {
        if (!dbConnection.isTransactionActive)
            throw new Error(`Transaction is not started yet, start transaction before committing it.`);

        await this.query(dbConnection, "COMMIT");
        dbConnection.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(dbConnection: DatabaseConnection): Promise<void> {
        if (!dbConnection.isTransactionActive)
            throw new Error(`Transaction is not started yet, start transaction before rolling it back.`);

        await this.query(dbConnection, "ROLLBACK");
        dbConnection.isTransactionActive = false;
    }

    /**
     * Clears all tables in the currently connected database.
     */
    async clearDatabase(dbConnection: DatabaseConnection): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
        const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS query FROM information_schema.tables WHERE table_schema = '${this.databaseName}'`;
        const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

        await this.query(dbConnection, disableForeignKeysCheckQuery);
        const dropQueries: ObjectLiteral[] = await this.query(dbConnection, dropTablesQuery);
        await Promise.all(dropQueries.map(query => this.query(dbConnection, query["query"])));
        await this.query(dbConnection, enableForeignKeysCheckQuery);
    }

    buildParameters(sql: string, parameters: ObjectLiteral) {
        if (!parameters || !Object.keys(parameters).length)
            return [];
        const builtParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + ")").join("|");
        sql.replace(new RegExp(keys, "g"), (key: string) => {
            const value = parameters[key.substr(1)];
            builtParameters.push(value);
            return "?";
        }); // todo: make replace only in value statements, otherwise problems
        return builtParameters;
    }

    replaceParameters(sql: string, parameters: ObjectLiteral) {
        if (!parameters || !Object.keys(parameters).length)
            return sql;

        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + ")").join("|");
        return sql.replace(new RegExp(keys, "g"), "?");
    }

    /**
     * Insert a new row with given values into given table.
     */
    async insert(dbConnection: DatabaseConnection, tableName: string, keyValues: ObjectLiteral, idColumnName?: string): Promise<any> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        const keys = Object.keys(keyValues);
        const columns = keys.map(key => this.escapeColumnName(key)).join(", ");
        const values = keys.map(key => "?").join(",");
        const parameters = keys.map(key => keyValues[key]);
        const sql = `INSERT INTO ${this.escapeTableName(tableName)}(${columns}) VALUES (${values})`;
        const result = await this.query(dbConnection, sql, parameters);
        return result.insertId;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(dbConnection: DatabaseConnection, tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE ${this.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(dbConnection, sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(dbConnection: DatabaseConnection, tableName: string, conditions: ObjectLiteral): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `DELETE FROM ${this.escapeTableName(tableName)} WHERE ${conditionString}`;
        const parameters = Object.keys(conditions).map(key => conditions[key]);
        await this.query(dbConnection, sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(dbConnection: DatabaseConnection, tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("mysql");

        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${this.escapeTableName(tableName)}(ancestor, descendant, level) ` +
                  `SELECT ancestor, ${newEntityId}, level + 1 FROM ${this.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                  `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${this.escapeTableName(tableName)}(ancestor, descendant) ` +
                  `SELECT ancestor, ${newEntityId} FROM ${this.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                  `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(dbConnection, sql);
        const results: ObjectLiteral[] = await this.query(dbConnection, `SELECT MAX(level) as level FROM ${this.escapeTableName(tableName)} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.mysql,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined,
            pool: this.pool
        };
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies() {
        if (!require)
            throw new DriverPackageLoadError();

        try {
            this.mysql = require("pg");
        } catch (e) {
            throw new DriverPackageNotInstalledError("Mysql", "mysql");
        }
    }

    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map(key => this.escapeColumnName(key) + "=?");
    }

}