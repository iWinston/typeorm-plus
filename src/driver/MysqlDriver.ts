import {Driver} from "./Driver";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
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
     * Access to the native implementation of the database.
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
                throw new Error("Mysql package was not found installed. Try to install it: npm install mysql --save");
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
     * Creates a query builder which can be used to build an sql queries.
     */
    get queryBuilderClass() {
        return QueryBuilder;
    }

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
            database: this.connectionOptions.database
        });
        return new Promise<void>((ok, fail) => {
            this.mysqlConnection.connect((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.mysqlConnection) 
            throw new ConnectionIsNotSetError("mysql");
        
        return new Promise<void>((ok, fail) => {
            this.mysqlConnection.end((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string): Promise<T> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
        
        this.logQuery(query);
        return new Promise<any>((ok, fail) => this.mysqlConnection.query(query, (err: any, result: any) => {
            if (err) {
                this.logFailedQuery(query);
                this.logQueryError(err);
                fail(err);
            } else {
                ok(result);
            }
        }));
    }

    /**
     * Clears all tables in the currently connected database.
     */
    clearDatabase(): Promise<void> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
        
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

    /**
     * Updates rows that match given conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
        
        const updateValues = this.escapeObjectMap(valuesMap).join(",");
        const conditionString = this.escapeObjectMap(conditions).join(" AND ");
        const query = `UPDATE ${tableName} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        return this.query(query).then(() => {});
        // const qb = this.createQueryBuilder().update(tableName, valuesMap).from(tableName, "t");
        // Object.keys(conditions).forEach(key => qb.andWhere(key + "=:" + key, { [key]: (<any> conditions)[key] }));
        // return qb.execute().then(() => {});
    }
    
    private escapeObjectMap(objectMap: { [key: string]: any }): string[] {
        return Object.keys(objectMap).map(key => {
            const value = (<any> objectMap)[key];
            if (value === null || value === undefined) {
                return key + "=NULL";
            } else {
                return key + "=" + this.escape(value);
            }
        });
    }

    /**
     * Insert a new row into given table.
     */
    insert(tableName: string, keyValues: Object): Promise<any> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
        
        const columns = Object.keys(keyValues).join(",");
        // const values  = this.escapeObjectMap(keyValues).join(",");
        const values  = Object.keys(keyValues).map(key => this.escape((<any> keyValues)[key])).join(","); // todo: escape here
        const query   = `INSERT INTO ${tableName}(${columns}) VALUES (${values})`;
        return this.query<any>(query).then(result => result.insertId);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    delete(tableName: string, conditions: Object): Promise<void> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");

        const conditionString = this.escapeObjectMap(conditions).join(" AND ");
        const query = `DELETE FROM ${tableName} WHERE ${conditionString}`;
        return this.query(query).then(() => {});
        // const qb = this.createQueryBuilder().delete(tableName);
        // Object.keys(conditions).forEach(key => qb.andWhere(key + "=:" + key, { [key]: (<any> conditions)[key] }));
        // return qb.execute().then(() => {});
    }

    /**
     * Starts mysql transaction.
     */
    beginTransaction(): Promise<void> {
        return this.query("START TRANSACTION").then(() => {});
    }

    /**
     * Ends mysql transaction.
     */
    endTransaction(): Promise<void> {
        return this.query("COMMIT").then(() => {});
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
                return moment(value).format("hh:mm:ss");
            case ColumnTypes.DATETIME:
                return moment(value).format("YYYY-MM-DD hh:mm:ss");
            case ColumnTypes.JSON:
                return JSON.stringify(value);
            case ColumnTypes.SIMPLE_ARRAY:
                return (value as Array<any>)
                    .map(i => String(i))
                    .join(",");
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any {
        switch (column.type) {
            case ColumnTypes.DATE:
                if (value instanceof Date)
                    return value;
                
                return moment(value, "YYYY-MM-DD").toDate();
            
            case ColumnTypes.TIME:
                return moment(value, "hh:mm:ss").toDate();
            
            case ColumnTypes.DATETIME:
                if (value instanceof Date)
                    return value;
                
                return moment(value, "YYYY-MM-DD hh:mm:ss").toDate();
            
            case ColumnTypes.JSON:
                return JSON.parse(value);
            
            case ColumnTypes.SIMPLE_ARRAY:
                return (value as string).split(",");
        }

        return value;
    }

    /**
     * Escapes given value.
     */
    escape(value: any): any {
        return this.mysqlConnection.escape(value);
    }

    /**
     * Inserts rows into closure table.
     */
    insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${tableName}(ancestor, descendant, level) ` +
                `SELECT ancestor, ${newEntityId}, level + 1 FROM ${tableName} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${tableName}(ancestor, descendant) ` +
                `SELECT ancestor, ${newEntityId} FROM ${tableName} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        return this.query(sql).then(() => {
            return this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
            
        }).then((results: any) => {
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        });
    }

}