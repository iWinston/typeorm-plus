import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {MysqlSchemaBuilder} from "../schema-builder/MysqlSchemaBuilder";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {BaseDriver} from "./BaseDriver";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import * as moment from "moment";
import {ConnectionOptions} from "../connection/ConnectionOptions";

/**
 * This driver organizes work with mysql database.
 */
export class MysqlDriver extends BaseDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used in this driver.
     */
    connectionOptions: ConnectionOptions;

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
    private mysqlConnection: any;
    
    // -------------------------------------------------------------------------
    // Getter Methods
    // -------------------------------------------------------------------------

    /**
     * Access to the native implementation of the database.
     */
    get native(): any {
        return this.mysql;
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
        if (this.mysqlConnection && this.mysqlConnection.config.database)
            return this.mysqlConnection.config.database;

        if (this.connectionOptions.database)
            return this.connectionOptions.database;
        
        throw new Error("Cannot get the database name. Since database name is not explicitly given in configuration " +
            "(maybe connection url is used?), database name cannot be retrieved until connection is made.");
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(mysql?: any) {
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
    createSchemaBuilder(): SchemaBuilder {
        return new MysqlSchemaBuilder(this);
    }

    /**
     * Performs connection to the database based on given connection options.
     */
    connect(): Promise<void> {
        this.mysqlConnection = this.mysql.createConnection({
            host: this.connectionOptions.host,
            user: this.connectionOptions.username,
            password: this.connectionOptions.password,
            database: this.connectionOptions.database,
            port: this.connectionOptions.port
        });
        return new Promise<void>((ok, fail) => {
            this.mysqlConnection.connect((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        this.checkIfConnectionSet();
        
        return new Promise<void>((ok, fail) => {
            this.mysqlConnection.end((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Escapes given value.
     */
    escape(value: any): any {
        return this.mysqlConnection.escape(value);
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string, parameters?: any[]): Promise<T> {
        this.checkIfConnectionSet();
        
        this.logQuery(query);
        return new Promise<T>((ok, fail) => this.mysqlConnection.query(query, parameters, (err: any, result: any) => {
            if (err) {
                this.logFailedQuery(query);
                this.logQueryError(err);
                fail(err);
            } else {
                ok(result);
                console.log("result:", result);
            }
        }));
    }

    /**
     * Clears all tables in the currently connected database.
     */
    clearDatabase(): Promise<void> {
        this.checkIfConnectionSet();
        
        const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
        const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS q FROM ` +
                                `information_schema.tables WHERE table_schema = '${this.db}';`;
        const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

        return this.query(disableForeignKeysCheckQuery)
            .then(() => this.query<any[]>(dropTablesQuery))
            .then(results => Promise.all(results.map(q => this.query(q["q"]))))
            .then(() => this.query(enableForeignKeysCheckQuery))
            .then(() => {});
    }

    buildParameters(sql: string, parameters: { [key: string]: any }) {
        const builtParameters: any[] = [];
        Object.keys(parameters).forEach((key, index) => {
            // const value = this.parameters[key] !== null && this.parameters[key] !== undefined ? this.driver.escape(this.parameters[key]) : "NULL";
            sql = sql.replace(new RegExp(":" + key, "g"), (str: string) => {
                builtParameters.push(parameters[key]);
                return "?";
            }); // todo: make replace only in value statements, otherwise problems
        });
        return builtParameters;
    }

    replaceParameters(sql: string, parameters: { [key: string]: any }) {
        Object.keys(parameters).forEach((key, index) => {
            // const value = parameters[key] !== null && parameters[key] !== undefined ? this.driver.escape(parameters[key]) : "NULL";
            sql = sql.replace(new RegExp(":" + key, "g"), (str: string) => {
                return "?";
            }); // todo: make replace only in value statements, otherwise problems
        });
        return sql;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected checkIfConnectionSet() {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
    }

}