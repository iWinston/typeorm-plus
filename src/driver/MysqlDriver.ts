import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {MysqlSchemaBuilder} from "../schema-builder/MysqlSchemaBuilder";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {BaseDriver} from "./BaseDriver";
import {DriverOptions} from "./DriverOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {DatabaseConnection} from "./DatabaseConnection";

/**
 * This driver organizes work with mysql database.
 */
export class MysqlDriver extends BaseDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    readonly isResultsLowercase = false;
    
    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Mysql library.
     */
    private mysql: any;

    /**
     * Connection to mysql database.
     */
    private mysqlConnection: DatabaseConnection|undefined;

    /**
     * Connection to mysql database.
     */
    private mysqlPool: any;

    private databaseConnectionPool: DatabaseConnection[] = [];

    // -------------------------------------------------------------------------
    // Getter Methods
    // -------------------------------------------------------------------------

    escapeColumnName(columnName: string): string {
        return columnName;
    }

    escapeAliasName(aliasName: string): string {
        return aliasName;
        // return "\"" + aliasName + "\"";
    }

    escapeTableName(tableName: string): string {
        return tableName;
        // return "\"" + aliasName + "\"";
    }

    retrieveDatabaseConnection(): Promise<DatabaseConnection> {
        if (this.mysqlPool) {
            return new Promise((ok, fail) => {
                this.mysqlPool.getConnection((err: any, connection: any) => {
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

        if (this.mysqlConnection)
            return Promise.resolve(this.mysqlConnection);

        throw new ConnectionIsNotSetError("mysql");
    }

    releaseDatabaseConnection(dbConnection: DatabaseConnection): Promise<void> {
        if (this.mysqlPool)
            dbConnection.connection.release();

        return Promise.resolve();
    }

    /**
     * Access to the native implementation of the database.
     */
    get native() {
        return {
            driver: this.mysql,
            connection: this.mysqlConnection,
            pool: this.mysqlPool
        };
    }

    /**
     * Access to the native connection to the database.
     */
    get nativeConnection(): any {
        return this.mysqlConnection;
    }

    /**
     * Database name to which this connection is made.
     */
    get db(): string {
        if (this.mysqlConnection && this.mysqlConnection.connection.config.database)
            return this.mysqlConnection.connection.config.database;

        if (this.connectionOptions.database)
            return this.connectionOptions.database;

        throw new Error("Cannot get the database name. Since database name is not explicitly given in configuration " +
            "(maybe connection url is used?), database name cannot be retrieved until connection is made.");
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(public connectionOptions: DriverOptions, mysql?: any) {
        super();

        // if driver dependency is not given explicitly, then try to load it via "require"
        if (!mysql && require) {
            try {
                mysql = require("mysql");

            } catch (e) {
                throw new Error("Mysql package has not been found installed. Try to install it: npm install mysql --save");
            }
        } else {
            throw new Error("Cannot load mysql driver dependencies. Try to install all required dependencies.");
        }

        this.mysql = mysql;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a schema builder which can be used to build database/table schemas.
     */
    createSchemaBuilder(dbConnection: DatabaseConnection): SchemaBuilder {
        return new MysqlSchemaBuilder(this, dbConnection);
    }

    /**
     * Performs connection to the database based on given connection options.
     */
    connect(): Promise<void> {
        const options = Object.assign({}, {
            host: this.connectionOptions.host,
            user: this.connectionOptions.username,
            password: this.connectionOptions.password,
            database: this.connectionOptions.database,
            port: this.connectionOptions.port
        }, this.connectionOptions.extra || {});

        if (this.connectionOptions.usePool === false) {
            return new Promise<void>((ok, fail) => {
                this.mysqlConnection = {
                    id: 1,
                    connection: this.mysql.createConnection(options),
                    isTransactionActive: false
                };
                this.mysqlConnection.connection.connect((err: any) => err ? fail(err) : ok());
            });

        } else {
            this.mysqlPool = this.mysql.createPool(options);
            return Promise.resolve();
        }
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        this.checkIfConnectionSet();

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();
            if (this.mysqlPool) {
                this.mysqlPool.end(handler);
                this.mysqlPool = undefined;
                this.databaseConnectionPool = [];
            }
            if (this.mysqlConnection) {
                this.mysqlConnection.connection.end(handler);
                this.mysqlConnection = undefined;
            }
        });
    }

    /**
     * Escapes given value.
     */
    escape(dbConnection: DatabaseConnection, value: any): any {
        return dbConnection.connection.escape(value);
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(dbConnection: DatabaseConnection, query: string, parameters?: any[]): Promise<T> {
        this.checkIfConnectionSet();
        this.logQuery(query);
        return new Promise((ok, fail) => dbConnection.connection.query(query, parameters, (err: any, result: any) => {
            if (err) {
                this.logFailedQuery(query);
                this.logQueryError(err);
                fail(err);
            } else {
                // console.log(`OK [${dbConnection.id}]: `, query);
                ok(result);
            }
        }));
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
        this.checkIfConnectionSet();

        const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
        const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS q FROM ` +
            `information_schema.tables WHERE table_schema = '${this.db}';`;
        const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

        return this.query(dbConnection, disableForeignKeysCheckQuery)
            .then(() => this.query<any[]>(dbConnection, dropTablesQuery))
            .then(results => Promise.all(results.map(q => this.query(dbConnection, q["q"]))))
            .then(() => this.query(dbConnection, enableForeignKeysCheckQuery))
            .then(() => {});
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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected checkIfConnectionSet() {
        if (!this.mysqlConnection && !this.mysqlPool)
            throw new ConnectionIsNotSetError("mysql");
    }

}