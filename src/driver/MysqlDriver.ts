import {Driver} from "./Driver";
import {ConnectionOptions} from "../connection/ConnectionOptions";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {MysqlSchemaBuilder} from "../schema-builder/MysqlSchemaBuilder";
import {Connection} from "../connection/Connection";
import {ConnectionIsNotSetError} from "./error/ConnectionIsNotSetError";
import {BaseDriver} from "./BaseDriver";

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
    connection: Connection;
    
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
     * Database name to which this connection is made.
     */
    get db(): string {
        return this.connection.options.database;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(mysql: any) {
        super();
        this.mysql = mysql;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a query builder which can be used to build an sql queries.
     */
    createQueryBuilder<Entity>(): QueryBuilder<Entity> {
        return new QueryBuilder<Entity>(this.connection);
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
    connect(options: ConnectionOptions): Promise<void> {
        this.mysqlConnection = this.mysql.createConnection({
            host: options.host,
            user: options.username,
            password: options.password,
            database: options.database
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
        
        const qb = this.createQueryBuilder().update(tableName, valuesMap).from(tableName, "t");
        Object.keys(conditions).forEach(key => qb.andWhere(key + "=:" + key, { [key]: (<any> conditions)[key] }));
        return qb.execute().then(() => {});
    }

    /**
     * Insert a new row into given table.
     */
    insert(tableName: string, keyValues: Object): Promise<any> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
        
        const columns = Object.keys(keyValues).join(",");
        const values  = Object.keys(keyValues).map(key => (<any> keyValues)[key]).join(",");
        const query   = `INSERT INTO ${tableName}(${columns}) VALUES (${values})`;
        return this.query(query);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    delete(tableName: string, conditions: Object): Promise<void> {
        if (!this.mysqlConnection)
            throw new ConnectionIsNotSetError("mysql");
        
        const qb = this.createQueryBuilder().delete(tableName);
        Object.keys(conditions).forEach(key => qb.andWhere(key + "=:" + key, { [key]: (<any> conditions)[key] }));
        return qb.execute().then(() => {});
    }

}