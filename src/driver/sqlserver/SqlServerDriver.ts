import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "../error/DriverPackageLoadError";
import {DriverUtils} from "../DriverUtils";
import {Logger} from "../../logger/Logger";
import {QueryRunner} from "../QueryRunner";
import {SqlServerQueryRunner} from "./SqlServerQueryRunner";
import {ColumnTypes, ColumnType} from "../../metadata/types/ColumnTypes";
import * as moment from "moment";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";

/**
 * Organizes communication with SQL Server DBMS.
 */
export class SqlServerDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Driver connection options.
     */
    readonly options: DriverOptions;

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
    protected connection: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnectionPool: DatabaseConnection[] = [];

    /**
     * Logger used go log queries and errors.
     */
    protected logger: Logger;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: DriverOptions, logger: Logger, mssql?: any) {

        this.options = DriverUtils.buildDriverOptions(options);
        this.logger = logger;
        this.mssql = mssql;

        // validate options to make sure everything is set
        if (!this.options.host)
            throw new DriverOptionNotSetError("host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // if mssql package instance was not set explicitly then try to load it
        if (!mssql)
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
            server: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        return new Promise<void>((ok, fail) => {
            const connection = new this.mssql.Connection(options).connect((err: any) => {
                if (err) return fail(err);
                this.connection = connection;
                if (this.options.usePool === false) {
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
        if (!this.connection)
            throw new ConnectionIsNotSetError("mssql");

        this.connection.close();
        this.connection = undefined;
        this.databaseConnection = undefined;
        this.databaseConnectionPool = [];
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.connection)
            return Promise.reject(new ConnectionIsNotSetError("mssql"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new SqlServerQueryRunner(databaseConnection, this, this.logger);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.mssql,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined,
            pool: this.connection
        };
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];
        let index = 0;
        const escapedParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            escapedParameters.push(parameters[key.substr(1)]);
            index++;
            return "@" + (index - 1);
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

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
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any {
        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value === true ? 1 : 0;
            case ColumnTypes.DATE:
                return moment(value).format("YYYY-MM-DD");
            case ColumnTypes.TIME:
                return moment(value).format("HH:mm:ss");
            case ColumnTypes.DATETIME:
                return moment(value).format("YYYY-MM-DD HH:mm:ss");
            case ColumnTypes.JSON:
                return JSON.stringify(value);
            case ColumnTypes.SIMPLE_ARRAY:
                return (value as any[])
                    .map(i => String(i))
                    .join(",");
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column metadata.
     */
    prepareHydratedValue(value: any, type: ColumnType): any;

    /**
     * Prepares given value to a value to be persisted, based on its column type.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any;

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnOrColumnType: ColumnMetadata|ColumnType): any {
        const type = columnOrColumnType instanceof ColumnMetadata ? columnOrColumnType.type : columnOrColumnType;
        switch (type) {
            case ColumnTypes.BOOLEAN:
                return value ? true : false;

            case ColumnTypes.DATE:
                if (value instanceof Date)
                    return value;

                return moment(value, "YYYY-MM-DD").toDate();

            case ColumnTypes.TIME:
                return moment(value, "HH:mm:ss").toDate();

            case ColumnTypes.DATETIME:
                if (value instanceof Date)
                    return value;

                return moment(value, "YYYY-MM-DD HH:mm:ss").toDate();

            case ColumnTypes.JSON:
                return JSON.parse(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return (value as string).split(",");
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

        if (!this.connection)
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
                connection: this.connection,
                transaction: this.connection.transaction(),
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
        if (!require)
            throw new DriverPackageLoadError();

        try {
            this.mssql = require("mssql");
        } catch (e) {
            throw new DriverPackageNotInstalledError("SQL Server", "mssql");
        }
    }

}