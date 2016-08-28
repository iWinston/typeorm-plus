import {Driver} from "../Driver";
import {SchemaBuilder} from "../../schema-builder/SchemaBuilder";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {PostgresSchemaBuilder} from "../../schema-builder/PostgresSchemaBuilder";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverPackageLoadError} from "../error/DriverPackageLoadError";
import {DriverUtils} from "../DriverUtils";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Logger} from "../../logger/Logger";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import * as moment from "moment";
import {PostgresQueryRunner} from "./PostgresQueryRunner";
import {QueryRunner} from "../QueryRunner";

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

    /**
     * Driver connection options.
     */
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
     * Logger used go log queries and errors.
     */
    protected logger: Logger;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOptions: DriverOptions, logger: Logger, postgres?: any) {

        this.options = DriverUtils.buildDriverOptions(connectionOptions);
        this.logger = logger;
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
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.databaseConnection && !this.pool)
            return Promise.reject(new ConnectionIsNotSetError("postgres"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new PostgresQueryRunner(databaseConnection, this.options.database, this.logger);
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
                    ok(dbConnection);
                });
            });
        }

        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        throw new ConnectionIsNotSetError("postgres");
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        if (!require)
            throw new DriverPackageLoadError();

        try {
            this.postgres = require("pg");
        } catch (e) {
            throw new DriverPackageNotInstalledError("Postgres", "pg");
        }
    }

}