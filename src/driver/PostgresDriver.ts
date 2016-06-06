import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {BaseDriver} from "./BaseDriver";
import {ConnectionOptions} from "../connection/ConnectionOptions";
import {PostgresSchemaBuilder} from "../schema-builder/PostgresSchemaBuilder";

/**
 * This driver organizes work with postgres database.
 */
export class PostgresDriver extends BaseDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used in this driver.
     */
    connectionOptions: ConnectionOptions;
    
    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Postgres library.
     */
    private postgres: any;

    /**
     * Connection to postgres database.
     */
    private postgresConnection: any;
    
    // -------------------------------------------------------------------------
    // Getter Methods
    // -------------------------------------------------------------------------

    /**
     * Access to the native implementation of the database.
     */
    get native(): any {
        return this.postgres;
    }
    
    /**
     * Access to the native connection to the database.
     */
    get nativeConnection(): any {
        return this.postgresConnection;
    }

    /**
     * Database name to which this connection is made.
     */
    get db(): string {
        // if (this.postgresConnection && this.postgresConnection.config.database)
        //     return this.postgresConnection.config.database;

        if (this.connectionOptions.database)
            return this.connectionOptions.database;
        
        throw new Error("Cannot get the database name. Since database name is not explicitly given in configuration " +
            "(maybe connection url is used?), database name cannot be retrieved until connection is made.");
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(postgres?: any) {
        super();

        // if driver dependency is not given explicitly, then try to load it via "require"
        if (!postgres && require) {
            try {
                postgres = require("pg");
                
            } catch (e) {
                throw new Error("Postgres package has not been found installed. Try to install it: npm install pg --save");
            }
        } else {
            throw new Error("Cannot load postgres driver dependencies. Try to install all required dependencies.");
        }

        this.postgres = postgres;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a schema builder which can be used to build database/table schemas.
     */
    createSchemaBuilder(): SchemaBuilder {
        return new PostgresSchemaBuilder(this);
    }

    /**
     * Performs connection to the database based on given connection options.
     */
    connect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.postgresConnection = new this.postgres.Client({
                host: this.connectionOptions.host,
                user: this.connectionOptions.username,
                password: this.connectionOptions.password,
                database: this.connectionOptions.database,
                port: this.connectionOptions.port
            });
            this.postgresConnection.connect((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        this.checkIfConnectionSet();
        
        return new Promise<void>((ok, fail) => {
            this.postgresConnection.end(/*(err: any) => err ? fail(err) : ok()*/); // todo: check if it can emit errors
            ok();
        });
    }

    /**
     * Escapes given value.
     */
    escape(value: any): any {
        return this.postgresConnection.escape(value);
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string): Promise<T> {
        this.checkIfConnectionSet();
        
        this.logQuery(query);
        return new Promise<T>((ok, fail) => this.postgresConnection.query(query, (err: any, result: any) => {
            if (err) {
                this.logFailedQuery(query);
                this.logQueryError(err);
                fail(err);
            } else {
                ok(result.rows);
            }
        }));
    }

    /**
     * Clears all tables in the currently connected database.
     */
    clearDatabase(): Promise<void> {
        this.checkIfConnectionSet(); // todo:
        
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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected checkIfConnectionSet() {
        if (!this.postgresConnection)
            throw new ConnectionIsNotSetError("postgres");
    }

}