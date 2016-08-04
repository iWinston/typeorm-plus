import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {BaseDriver} from "./BaseDriver";
import {ConnectionOptions} from "../connection/ConnectionOptions";
import {PostgresSchemaBuilder} from "../schema-builder/PostgresSchemaBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";

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

    readonly isResultsLowercase = true;

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
        return value; // TODO: this.postgresConnection.escape(value);
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string, parameters?: any[]): Promise<T> {
        this.checkIfConnectionSet();

        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        this.logQuery(query);
        return new Promise<T>((ok, fail) => this.postgresConnection.query(query, parameters, (err: any, result: any) => {
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
        this.checkIfConnectionSet();
        
        const dropTablesQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as q FROM pg_tables WHERE schemaname = 'public';`;
        return this.query<any[]>(dropTablesQuery)
            .then(results => Promise.all(results.map(q => this.query(q["q"]))))
            .then(() => {});
    }

    buildParameters(sql: string, parameters: ObjectLiteral) {
        const builtParameters: any[] = [];
        Object.keys(parameters).forEach((key, index) => {
            // const value = this.parameters[key] !== null && this.parameters[key] !== undefined ? this.driver.escape(this.parameters[key]) : "NULL";
            sql = sql.replace(new RegExp(":" + key, "g"), (str: string) => {
                builtParameters.push(parameters[key]);
                return "";
            }); // todo: make replace only in value statements, otherwise problems
        });
        return builtParameters;
    }

    replaceParameters(sql: string, parameters: ObjectLiteral) {
        Object.keys(parameters).forEach((key, index) => {
            // const value = parameters[key] !== null && parameters[key] !== undefined ? this.driver.escape(parameters[key]) : "NULL";
            sql = sql.replace(new RegExp(":" + key, "g"), (str: string) => {
                return "$" + (index + 1);
            }); // todo: make replace only in value statements, otherwise problems
        });
        return sql;
    }

    /**
     * Insert a new row into given table.
     */
    insert(tableName: string, keyValues: ObjectLiteral, idColumnName?: string): Promise<any> {
        this.checkIfConnectionSet();

        const columns = Object.keys(keyValues).join(",");
        const values  = Object.keys(keyValues).map((key, index) => "$" + (index + 1)).join(","); // todo: escape here
        const params  = Object.keys(keyValues).map(key => keyValues[key]);
        let query   = `INSERT INTO ${tableName}(${columns}) VALUES (${values})`;
        if (idColumnName) {
            query += " RETURNING " + idColumnName;
        }
        return this.query<any>(query, params).then(result => {
            if (idColumnName)
                return result[0][idColumnName];

            return undefined;
        });
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        this.checkIfConnectionSet();

        const updateValues = this.parametrizeObjectMap(valuesMap).join(",");
        const conditionString = this.parametrizeObjectMap(conditions, Object.keys(valuesMap).length).join(" AND ");
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const query = `UPDATE ${tableName} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        // console.log("executing update: ", query);
        await this.query(query, updateParams.concat(conditionParams));
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral): Promise<void> {
        this.checkIfConnectionSet();

        const conditionString = this.parametrizeObjectMap(conditions).join(" AND ");
        const params = Object.keys(conditions).map(key => conditions[key]);

        const query = `DELETE FROM ${tableName} WHERE ${conditionString}`;
        await this.query(query, params);
    }


    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected parametrizeObjectMap(objectMap: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectMap).map((key, index) => {
            const value = (objectMap as any)[key];
            // if (value === null || value === undefined) { // todo: I think we dont really need this
            //     return key + "=NULL";
            // } else {
                return key + "=$" + (startIndex + index + 1);
            // }
        });
    }

    protected checkIfConnectionSet() {
        if (!this.postgresConnection)
            throw new ConnectionIsNotSetError("postgres");
    }

}