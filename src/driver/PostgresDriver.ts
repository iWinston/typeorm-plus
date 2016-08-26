import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {DriverOptions} from "./DriverOptions";
import {PostgresSchemaBuilder} from "../schema-builder/PostgresSchemaBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {DatabaseConnection} from "./DatabaseConnection";
import {DriverPackageNotInstalledError} from "./error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "./error/DriverPackageLoadError";
import {DriverUtils} from "./DriverUtils";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {Logger} from "../logger/Logger";

// todo(tests):
// check connection with url
// check if any of required option is not set exception to be thrown
//

/**
 * This driver organizes work with postgres database.
 */
export class PostgresDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    readonly options: DriverOptions;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Postgres library.
     */
    protected postgres: any;

    /**
     * Connection to postgres database.
     */
    protected databaseConnection: DatabaseConnection|undefined;

    /**
     * Postgres pool.
     */
    protected pool: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnectionPool: DatabaseConnection[] = [];

    /**
     * Logger.
     */
    protected logger: Logger;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOptions: DriverOptions, postgres?: any) {

        this.options = DriverUtils.buildDriverOptions(connectionOptions);
        this.logger = new Logger(this.options.logging);
        this.postgres = postgres;

        // validate options to make sure everything is set
        DriverUtils.validateDriverOptions(this.options);

        // if postgres package instance was not set explicitly then try to load it
        if (!postgres)
            this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return "\"" + columnName + "\"";
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return "\"" + aliasName + "\"";
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return "\"" + tableName + "\"";
    }

    /**
     * Retrieves a new database connection.
     * If pooling is enabled then connection from the pool will be retrieved.
     * Otherwise active connection will be returned.
     */
    retrieveDatabaseConnection(): Promise<DatabaseConnection> {
        if (this.pool) {
            return new Promise((ok, fail) => {
                this.pool.connect((err: any, connection: any, release: Function) => {
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
                    dbConnection.releaseCallback = release;
                    ok(dbConnection);
                });
            });
        }

        if (this.databaseConnection) // todo: rename postgresConnection and mysqlConnection to databaseConnection
            return Promise.resolve(this.databaseConnection);

        throw new ConnectionIsNotSetError("postgres");
    }

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     */
    releaseDatabaseConnection(dbConnection: DatabaseConnection): Promise<void> {
        if (this.pool && dbConnection.releaseCallback) {
            dbConnection.releaseCallback();
            this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
        }

        return Promise.resolve();
    }

    /**
     * Creates a schema builder which can be used to build database/table schemas.
     */
    createSchemaBuilder(dbConnection: DatabaseConnection): SchemaBuilder {
        return new PostgresSchemaBuilder(this, dbConnection);
    }

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void> {

        // build connection options for the driver
        const options = Object.assign({}, {
            host: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        if (this.options.usePool === undefined || this.options.usePool === true) {
            this.pool = new this.postgres.Pool(options);
            return Promise.resolve();

        } else {
            return new Promise<void>((ok, fail) => {
                this.databaseConnection = {
                    id: 1,
                    connection: new this.postgres.Client(options),
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
            throw new ConnectionIsNotSetError("postgres");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            if (this.databaseConnection) {
                this.databaseConnection.connection.end(/*handler*/); // todo: check if it can emit errors
                this.databaseConnection = undefined;
            }

            if (this.databaseConnectionPool) {
                this.databaseConnectionPool.forEach(dbConnection => {
                    if (dbConnection && dbConnection.releaseCallback) {
                        dbConnection.releaseCallback();
                    }
                });
                this.pool.end(handler);
                this.pool = undefined;
                this.databaseConnectionPool = [];
            }

            ok();
        });
    }

    /**
     * Executes a given SQL query.
     */
    query(dbConnection: DatabaseConnection, query: string, parameters?: any[]): Promise<any> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("postgres");

        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        this.logger.logQuery(query);
        return new Promise<any[]>((ok, fail) => {
            dbConnection.connection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query);
                    this.logger.logQueryError(err);
                    fail(err);
                } else {
                    ok(result.rows);
                }
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
    clearDatabase(dbConnection: DatabaseConnection): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("postgres");

        const dropTablesQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as q FROM pg_tables WHERE schemaname = 'public'`;
        return this.query(dbConnection, dropTablesQuery)
            .then((results: any[]) => Promise.all(results.map(q => this.query(dbConnection, q["q"]))))
            .then(() => {});
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];

        const builtParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + ")").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            const value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    builtParameters.push(v);
                    return "$" + builtParameters.length;
                });
            } else {
                builtParameters.push(value);
            }
            return "$" + builtParameters.length;
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, builtParameters];
    }

    /**
     * Insert a new row into given table.
     */
    async insert(dbConnection: DatabaseConnection, tableName: string, keyValues: ObjectLiteral, idColumnName?: string): Promise<any> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("postgres");

        const columns = Object.keys(keyValues).map(key => this.escapeColumnName(key)).join(", ");
        const values = Object.keys(keyValues).map((key, index) => "$" + (index + 1)).join(","); // todo: escape here
        const parameters = Object.keys(keyValues).map(key => keyValues[key]);
        let sql = `INSERT INTO ${this.escapeTableName(tableName)}(${columns}) VALUES (${values})`;
        if (idColumnName)
            sql += " RETURNING " + this.escapeColumnName(idColumnName);

        const result: ObjectLiteral[] = await this.query(dbConnection, sql, parameters);
        if (idColumnName)
            return result[0][idColumnName];

        return result;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(dbConnection: DatabaseConnection, tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("postgres");

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const query = `UPDATE ${this.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        await this.query(dbConnection, query, updateParams.concat(conditionParams));
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(dbConnection: DatabaseConnection, tableName: string, conditions: ObjectLiteral): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("postgres");

        const conditionString = this.parametrize(conditions).join(" AND ");
        const params = Object.keys(conditions).map(key => conditions[key]);

        const query = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(dbConnection, query, params);
    }

    /**
     * Inserts rows into closure table.
     */
    async insertIntoClosureTable(dbConnection: DatabaseConnection, tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
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
        const results: ObjectLiteral[] = await this.query(dbConnection, `SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.postgres,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined,
            pool: this.pool
        };
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any {
        return ColumnTypes.preparePersistentValue(value, column.type);
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any {
        return ColumnTypes.prepareHydratedValue(value, column.type);
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
            this.postgres = require("pg");
        } catch (e) {
            throw new DriverPackageNotInstalledError("Postgres", "pg");
        }
    }

    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => this.escapeColumnName(key) + "=$" + (startIndex + index + 1));
    }

}