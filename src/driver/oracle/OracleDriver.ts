import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "../error/DriverPackageLoadError";
import {DriverUtils} from "../DriverUtils";
import {Logger} from "../../logger/Logger";
import {QueryRunner} from "../QueryRunner";
import {OracleQueryRunner} from "./OracleQueryRunner";
import {ColumnTypes, ColumnType} from "../../metadata/types/ColumnTypes";
import * as moment from "moment";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";

/**
 * Organizes communication with Oracle DBMS.
 */
export class OracleDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Driver connection options.
     */
    readonly options: DriverOptions;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Oracle library.
     */
    protected oracle: any;

    /**
     * Connection to oracle database.
     */
    protected databaseConnection: DatabaseConnection|undefined;

    /**
     * Oracle pool.
     */
    protected pool: any;

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

    constructor(options: DriverOptions, logger: Logger, oracle?: any) {

        this.options = DriverUtils.buildDriverOptions(options, { useSid: true });
        this.logger = logger;
        this.oracle = oracle;

        // validate options to make sure everything is set
        if (!this.options.host)
            throw new DriverOptionNotSetError("host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.sid)
            throw new DriverOptionNotSetError("sid");

        // if oracle package instance was not set explicitly then try to load it
        if (!oracle)
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
            user: this.options.username,
            password: this.options.password,
            connectString: this.options.host + ":" + this.options.port + "/" + this.options.sid,
        }, this.options.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        if (this.options.usePool === undefined || this.options.usePool === true) {
            return new Promise<void>((ok, fail) => {
                this.oracle.createPool(options, (err: any, pool: any) => {
                    if (err)
                        return fail(err);

                    this.pool = pool;
                    ok();
                });
            });

        } else {
            return new Promise<void>((ok, fail) => {
                this.oracle.getConnection(options, (err: any, connection: any) => {
                    if (err)
                        return fail(err);

                    this.databaseConnection = {
                        id: 1,
                        connection: connection,
                        isTransactionActive: false
                    };
                    this.databaseConnection.connection.connect((err: any) => err ? fail(err) : ok());
                });
            });
        }
    }

    /**
     * Closes connection with the database.
     */
    disconnect(): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("oracle");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            // if pooling is used, then disconnect from it
            if (this.pool) {
                this.pool.close(handler);
                this.pool = undefined;
                this.databaseConnectionPool = [];
            }

            // if single connection is opened, then close it
            if (this.databaseConnection) {
                this.databaseConnection.connection.close(handler);
                this.databaseConnection = undefined;
            }
        });
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.databaseConnection && !this.pool)
            return Promise.reject(new ConnectionIsNotSetError("oracle"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new OracleQueryRunner(databaseConnection, this, this.logger);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.oracle,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined,
            pool: this.pool
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
            escapedParameters.push(parameters[key.substr(1)]);
            return ":" + key;
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

        if (this.pool) {
            return new Promise((ok, fail) => {
                this.pool.getConnection((err: any, connection: any) => {
                    if (err)
                        return fail(err);

                    let dbConnection = this.databaseConnectionPool.find(dbConnection => dbConnection.connection === connection);
                    if (!dbConnection) {
                        dbConnection = {
                            id: this.databaseConnectionPool.length,
                            connection: connection,
                            isTransactionActive: false
                        };
                        dbConnection.releaseCallback = () => {
                            return new Promise((ok, fail) => {
                                connection.close((err: any) => {
                                    if (err)
                                        return fail(err);

                                    if (this.pool && dbConnection) {
                                        this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
                                    }
                                    ok();
                                });
                            });
                        };
                        this.databaseConnectionPool.push(dbConnection);
                    }
                    ok(dbConnection);
                });
            });
        }

        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        throw new ConnectionIsNotSetError("oracle");
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        if (!require)
            throw new DriverPackageLoadError();

        try {
            this.oracle = require("oracledb");
        } catch (e) {
            throw new DriverPackageNotInstalledError("Oracle", "oracledb");
        }
    }

}