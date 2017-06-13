import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {MysqlQueryRunner} from "./MysqlQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";
import {DataUtils} from "../../util/DataUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {SchemaBuilder} from "../../schema-builder/SchemaBuilder";
import {MysqlConnectionOptions} from "./MysqlConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";

/**
 * Organizes communication with MySQL DBMS.
 */
export class MysqlDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.tutorialspoint.com/mysql/mysql-data-types.htm
     * @see https://dev.mysql.com/doc/refman/5.7/en/data-types.html
     */
    supportedDataTypes: ColumnType[] = [
        "int",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "float",
        "double",
        "decimal",
        "date",
        "datetime",
        "timestamp",
        "time",
        "year",
        "char",
        "varchar",
        "blob",
        "text",
        "tinyblob",
        "tinytext",
        "mediumblob",
        "mediumtext",
        "longblob",
        "longtext",
        "enum"
    ];

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        updateDate: "datetime",
        version: "int",
        treeLevel: "int",
        migrationName: "varchar",
        migrationTimestamp: "timestamp",
    };

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    protected options: MysqlConnectionOptions;

    /**
     * Mysql underlying library.
     */
    protected mysql: any;

    /**
     * Database connection pool created by underlying driver.
     */
    protected pool: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnections: DatabaseConnection[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(protected connection: Connection) {
        this.options = connection.options as MysqlConnectionOptions;

        Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way

        // validate options to make sure everything is set
        if (!(this.options.host || (this.options.extra && this.options.extra.socketPath)))
            throw new DriverOptionNotSetError("socketPath and host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load mysql package
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {

        // build connection options for the driver
        const options = Object.assign({}, {
            host: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        this.pool = this.mysql.createPool(options);
    }

    /**
     * Closes connection with the database.
     */
    disconnect(): Promise<void> {
        if (!this.pool)
            throw new ConnectionIsNotSetError("mysql");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();
            this.pool.end(handler);
            this.pool = undefined;
            this.databaseConnections = [];
        });
    }

    /**
     * Synchronizes database schema (creates tables, indices, etc).
     */
    syncSchema(): Promise<void> {
        if (!this.pool)
            throw new ConnectionIsNotSetError("mysql");

        const schemaBuilder = new SchemaBuilder(this.connection);
        return schemaBuilder.build();
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.pool)
            return Promise.reject(new ConnectionIsNotSetError("mysql"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new MysqlQueryRunner(this.connection, databaseConnection);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.mysql,
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
            return "?";
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return "`" + columnName + "`";
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return "`" + aliasName + "`";
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return "`" + tableName + "`";
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DataUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DataUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "datetime") {
            return DataUtils.mixedDateToUtcDatetimeString(value);

        } else if (columnMetadata.type === "json") {
            return JSON.stringify(value);

        } else if (columnMetadata.type === "simple-array") {
            return DataUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.type === Boolean) {
            return value ? true : false;

        } else if (columnMetadata.type === "datetime") {
            return DataUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            return DataUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DataUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === "json") {
            return JSON.parse(value);

        } else if (columnMetadata.type === "simple-array") {
            return DataUtils.stringToSimpleArray(value);
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
        return new Promise((ok, fail) => {
            this.pool.getConnection((err: any, connection: any) => {
                if (err)
                    return fail(err);

                let dbConnection = this.databaseConnections.find(dbConnection => dbConnection.connection === connection);
                if (!dbConnection) {
                    const driver = this;
                    dbConnection = {
                        connection: connection,
                        releaseCallback: function() {
                            if (driver.pool) {
                                connection.release();
                                driver.databaseConnections.splice(driver.databaseConnections.indexOf(this), 1);
                            }
                            return Promise.resolve();
                        }
                    };
                    this.databaseConnections.push(dbConnection);
                }
                ok(dbConnection);
            });
        });
    }

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        try {
            this.mysql = PlatformTools.load("mysql");  // try to load first supported package

        } catch (e) {
            try {
                this.mysql = PlatformTools.load("mysql2"); // try to load second supported package

            } catch (e) {
                throw new DriverPackageNotInstalledError("Mysql", "mysql");
            }
        }
    }

}