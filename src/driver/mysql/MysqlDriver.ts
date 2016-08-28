import {Driver} from "../Driver";
import {SchemaBuilder} from "../../schema-builder/SchemaBuilder";
import {MysqlSchemaBuilder} from "../../schema-builder/MysqlSchemaBuilder";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "../error/DriverPackageLoadError";
import {DriverUtils} from "../DriverUtils";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Logger} from "../../logger/Logger";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import * as moment from "moment";
import {QueryRunner} from "../QueryRunner";
import {MysqlQueryRunner} from "./MysqlQueryRunner";

/**
 * This driver organizes work with mysql database.
 */
export class MysqlDriver implements Driver {

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

    /**
     * Logger used go log queries and errors.
     */
    protected logger: Logger;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: DriverOptions, logger: Logger, mysql?: any) {

        this.options = DriverUtils.buildDriverOptions(options);
        this.logger = logger;
        this.mysql = mysql;

        // validate options to make sure everything is set
        DriverUtils.validateDriverOptions(this.options);

        // if mysql package instance was not set explicitly then try to load it
        if (!mysql)
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
        if (this.options.usePool === undefined || this.options.usePool === true) {
            this.pool = this.mysql.createPool(options);
            return Promise.resolve();

        } else {
            return new Promise<void>((ok, fail) => {
                const connection = this.mysql.createConnection(options);
                this.databaseConnection = {
                    id: 1,
                    connection: connection,
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
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.databaseConnection && !this.pool)
            return Promise.reject(new ConnectionIsNotSetError("mysql"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new MysqlQueryRunner(databaseConnection, this.logger);
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
                            if (this.pool && dbConnection) {
                                connection.release();
                                this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
                            }
                            return Promise.resolve();
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
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        if (!require)
            throw new DriverPackageLoadError();

        try {
            this.mysql = require("mysql");
        } catch (e) {
            throw new DriverPackageNotInstalledError("Mysql", "mysql");
        }
    }

}