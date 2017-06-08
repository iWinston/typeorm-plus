import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {Logger} from "../../logger/Logger";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {SqlServerQueryRunner} from "./SqlServerQueryRunner";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";
import {DataTransformationUtils} from "../../util/DataTransformationUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";
import {LazyRelationsWrapper} from "../../lazy-loading/LazyRelationsWrapper";
import {Connection} from "../../connection/Connection";
import {SchemaBuilder} from "../../schema-builder/SchemaBuilder";

/**
 * Organizes communication with SQL Server DBMS.
 */
export class SqlServerDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * SQL Server library.
     */
    public mssql: any;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Connection to mssql database.
     */
    protected databaseConnection: DatabaseConnection|undefined;

    /**
     * SQL Server pool.
     */
    protected connectionPool: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnectionPool: DatabaseConnection[] = [];

    /**
     * Logger used to log queries and errors.
     */
    protected logger: Logger;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {

        Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way

        // validate options to make sure everything is set
        if (!connection.options.host)
            throw new DriverOptionNotSetError("host");
        if (!connection.options.username)
            throw new DriverOptionNotSetError("username");
        if (!connection.options.database)
            throw new DriverOptionNotSetError("database");

        // load mssql package
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
            server: this.connection.options.host,
            user: this.connection.options.username,
            password: this.connection.options.password,
            database: this.connection.options.database,
            port: this.connection.options.port
        }, this.connection.options.extra || {});

        // set default useUTC option if it hasn't been set
        if (!options.options) options.options = { useUTC: false };
        else if (!options.options.useUTC) options.options.useUTC = false; 

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        return new Promise<void>((ok, fail) => {
            const connection = new this.mssql.Connection(options).connect((err: any) => {
                if (err) return fail(err);
                this.connectionPool = connection;
                if (this.connection.options.usePool === false) {
                    this.databaseConnection = {
                        id: 1,
                        connection: new this.mssql.Request(connection),
                        isTransactionActive: false
                    };
                }
                ok();
            });
        });
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        if (!this.connectionPool)
            throw new ConnectionIsNotSetError("mssql");

        this.connectionPool.close();
        this.connectionPool = undefined;
        this.databaseConnection = undefined;
        this.databaseConnectionPool = [];
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
        if (!this.connectionPool)
            return Promise.reject(new ConnectionIsNotSetError("mssql"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new SqlServerQueryRunner(this.connection, databaseConnection);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.mssql,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined,
            pool: this.connectionPool
        };
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];
        const escapedParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            const value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    escapedParameters.push(v);
                    return "@" + (escapedParameters.length - 1);
                }).join(", ");
            } else {
                escapedParameters.push(value);
            }
            return "@" + (escapedParameters.length - 1);
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return `"${columnName}"`;
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return `"${aliasName}"`;
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return `"${tableName}"`;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return null;

        switch (columnMetadata.type) {
            case ColumnTypes.BOOLEAN:
                return value === true ? 1 : 0;

            case ColumnTypes.DATE:
                return DataTransformationUtils.mixedDateToDateString(value);

            case ColumnTypes.TIME:
                return DataTransformationUtils.mixedDateToTimeString(value);

            case ColumnTypes.DATETIME:
                if (columnMetadata.localTimezone) {
                    return DataTransformationUtils.mixedDateToDatetimeString(value);
                } else {
                    return DataTransformationUtils.mixedDateToUtcDatetimeString(value);
                }

            case ColumnTypes.JSON:
                return JSON.stringify(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return DataTransformationUtils.simpleArrayToString(value);
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
                return DataTransformationUtils.normalizeHydratedDate(value, columnMetadata.localTimezone === true);

            case ColumnTypes.DATE:
                return DataTransformationUtils.mixedDateToDateString(value);

            case ColumnTypes.TIME:
                return DataTransformationUtils.mixedTimeToString(value);

            case ColumnTypes.JSON:
                return JSON.parse(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return DataTransformationUtils.stringToSimpleArray(value);
        }

        return value;
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

        if (!this.connectionPool)
            throw new ConnectionIsNotSetError("mssql");

        return new Promise((ok, fail) => {
            if (this.databaseConnection)
                return ok(this.databaseConnection);
            // let dbConnection: DatabaseConnection|undefined;
            // const connection = this.pool.connect((err: any) => {
            //     if (err)
            //         return fail(err);
            //     ok(dbConnection);
            // });
            //
            // console.log(connection);
            // console.log(this.pool);
            // console.log(this.pool === connection);

            // const request = new this.mssql.Request(this.connection);
            // console.log("request:", request);
            // let dbConnection = this.databaseConnectionPool.find(dbConnection => dbConnection.connection === connection);
            // if (!dbConnection) {
            let dbConnection: DatabaseConnection = {
                id: this.databaseConnectionPool.length,
                connection: this.connectionPool,
                isTransactionActive: false
            };
            dbConnection.releaseCallback = () => {
                // }
                // if (this.connection && dbConnection) {
                // request.release();
                this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
                return Promise.resolve();
            };
            this.databaseConnectionPool.push(dbConnection);
            ok(dbConnection);
            // }
        });
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.mssql = PlatformTools.load("mssql");

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("SQL Server", "mssql");
        }
    }

}
