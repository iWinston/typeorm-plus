import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Logger} from "../../logger/Logger";
import {PostgresQueryRunner} from "./PostgresQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";
import {DataUtils} from "../../util/DataUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {SchemaBuilder} from "../../schema-builder/SchemaBuilder";
import {PostgresConnectionOptions} from "./PostgresConnectionOptions";

/**
 * Organizes communication with PostgreSQL DBMS.
 */
export class PostgresDriver implements Driver {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    protected options: PostgresConnectionOptions;

    /**
     * Postgres underlying library.
     */
    protected postgres: any;

    /**
     * Database connection pool created by underlying driver.
     */
    protected pool: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnectionPool: DatabaseConnection[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {

        this.options = connection.options as PostgresConnectionOptions;

        Object.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way

        // validate options to make sure everything is set
        if (!this.options.host)
            throw new DriverOptionNotSetError("host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load postgres package
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

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
        this.pool = new this.postgres.Pool(options);
        return Promise.resolve();
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.pool)
            throw new ConnectionIsNotSetError("postgres");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            this.databaseConnectionPool.forEach(dbConnection => {
                if (dbConnection && dbConnection.releaseCallback) {
                    dbConnection.releaseCallback();
                }
            });
            this.pool.end(handler);
            this.pool = undefined;
            this.databaseConnectionPool = [];
            ok();
        });
    }

    /**
     * Synchronizes database schema (creates tables, indices, etc).
     */
    syncSchema(): Promise<void> {
        const schemaBuilder = new SchemaBuilder(this.connection);
        return schemaBuilder.build();
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.pool)
            return Promise.reject(new ConnectionIsNotSetError("postgres"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new PostgresQueryRunner(this.connection, databaseConnection);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.postgres,
            pool: this.pool
        };
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any {
        if (value === null || value === undefined)
            return null;

        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value === true ? 1 : 0;

            case ColumnTypes.DATE:
                return DataUtils.mixedDateToDateString(value);

            case ColumnTypes.TIME:
                return DataUtils.mixedDateToTimeString(value);

            case ColumnTypes.DATETIME:
                if (column.localTimezone) {
                    return DataUtils.mixedDateToDatetimeString(value);
                } else {
                    return DataUtils.mixedDateToUtcDatetimeString(value);
                }

            case ColumnTypes.JSON:
            case ColumnTypes.JSONB:
                return JSON.stringify(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return DataUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        switch (columnMetadata.type) {
            case ColumnTypes.BOOLEAN:
                return value ? true : false;

            case ColumnTypes.DATETIME:
                return DataUtils.normalizeHydratedDate(value, columnMetadata.localTimezone === true);

            case ColumnTypes.DATE:
                return DataUtils.mixedDateToDateString(value);

            case ColumnTypes.TIME:
                return DataUtils.mixedTimeToString(value);

            case ColumnTypes.JSON:
            case ColumnTypes.JSONB:
                // pg(pg-types) have done JSON.parse conversion
                // https://github.com/brianc/node-pg-types/blob/ed2d0e36e33217b34530727a98d20b325389e73a/lib/textParsers.js#L170
                return value;

            case ColumnTypes.SIMPLE_ARRAY:
                return DataUtils.stringToSimpleArray(value);
        }

        return value;
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];

        const builtParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string): string => {
            const value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    builtParameters.push(v);
                    return "$" + builtParameters.length;
                }).join(", ");
            } else {
                builtParameters.push(value);
            }
            return "$" + builtParameters.length;
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, builtParameters];
    }

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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Retrieves a new database connection.
     * If pooling is enabled then connection from the pool will be retrieved.
     * Otherwise active connection will be returned.
     */
    protected retrieveDatabaseConnection(): Promise<DatabaseConnection> {
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
                dbConnection.releaseCallback = () => {
                    if (dbConnection) {
                        this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
                    }
                    release();
                    return Promise.resolve();
                };
                dbConnection.connection.query(`SET search_path TO '${this.options.schemaName || "default"}', 'public';`, (err: any) => {
                    if (err) {
                        this.connection.logger.logFailedQuery(`SET search_path TO '${this.options.schemaName || "default"}', 'public';`);
                        this.connection.logger.logQueryError(err);
                        fail(err);
                    } else {
                        ok(dbConnection);
                    }
                });
            });
        });
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.postgres = PlatformTools.load("pg");

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("Postgres", "pg");
        }
    }

}