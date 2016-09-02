import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "../error/DriverPackageLoadError";
import {DriverUtils} from "../DriverUtils";
import {ColumnTypes, ColumnType} from "../../metadata/types/ColumnTypes";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Logger} from "../../logger/Logger";
import * as moment from "moment";
import {SqliteQueryRunner} from "./SqliteQueryRunner";
import {QueryRunner} from "../QueryRunner";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";

/**
 * Organizes communication with sqlite DBMS.
 */
export class SqliteDriver implements Driver {

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
     * SQLite library.
     */
    protected sqlite: any;

    /**
     * Connection to SQLite database.
     */
    protected databaseConnection: DatabaseConnection|undefined;

    /**
     * Logger used go log queries and errors.
     */
    protected logger: Logger;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOptions: DriverOptions, logger: Logger, sqlite?: any) {

        this.options = connectionOptions;
        this.logger = logger;
        this.sqlite = sqlite;

        // validate options to make sure everything is set
        if (!this.options.storage)
            throw new DriverOptionNotSetError("storage");

        // if sqlite package instance was not set explicitly then try to load it
        if (!sqlite)
            this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            const connection = new this.sqlite.Database(this.options.storage, (err: any) => {
                if (err)
                    return fail(err);

                this.databaseConnection = {
                    id: 1,
                    connection: connection,
                    isTransactionActive: false
                };
                ok();
            });
        });
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            if (!this.databaseConnection)
                return fail(new ConnectionIsNotSetError("sqlite"));
            this.databaseConnection.connection.close(handler);
        });
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.databaseConnection)
            return Promise.reject(new ConnectionIsNotSetError("sqlite"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new SqliteQueryRunner(databaseConnection, this, this.logger);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.sqlite,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined
        };
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

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];

        const builtParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string): string  => {
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
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        throw new ConnectionIsNotSetError("sqlite");
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        if (!require)
            throw new DriverPackageLoadError();

        try {
            this.sqlite = require("sqlite3").verbose();
        } catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "sqlite3");
        }
    }

}