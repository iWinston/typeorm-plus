import {Driver} from "./Driver";
import {ConnectionOptions} from "../connection/ConnectionOptions";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {MysqlSchemaBuilder} from "../schema-builder/MysqlSchemaBuilder";
import {Connection} from "../connection/Connection";

/**
 * This driver organizes work with mysql database.
 */
export class MysqlDriver implements Driver {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    connection: Connection;
    
    private mysql: any;
    private mysqlConnection: any;
    private connectionOptions: ConnectionOptions;

    // -------------------------------------------------------------------------
    // Getter Methods
    // -------------------------------------------------------------------------

    get native(): any {
        return this.mysql;
    }
    
    get db(): string {
        return this.connectionOptions.database;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(mysql: any) {
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
        this.connectionOptions = options;
        this.mysqlConnection = this.mysql.createConnection({
            host: options.host,
            user: options.username,
            password: options.password,
            database: options.database
        });
        return new Promise<void>((ok, fail) => this.mysqlConnection.connect((err: any) => err ? fail(err) : ok()));
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.mysqlConnection) 
            throw new Error("Connection is not established, cannot disconnect.");
        
        return new Promise<void>((ok, fail) => {
            this.mysqlConnection.end((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string): Promise<T> {
        if (!this.mysqlConnection) throw new Error("Connection is not established, cannot execute a query.");
       // console.info("executing:", query);
        return new Promise<any>((ok, fail) => this.mysqlConnection.query(query, (err: any, result: any) => {
            if (err) {
                console.error("query failed: ", query);
                fail(err);
                return;
            }
            ok(result);
        }));
    }

    /**
     * Clears all tables in the currently connected database.
     */
    clearDatabase(): Promise<void> {
        if (!this.mysqlConnection) throw new Error("Connection is not established, cannot execute a query.");
        
        // todo: optrize and make coder better
        
        const query1 = `SET FOREIGN_KEY_CHECKS = 0;`;
        const query2 = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS q FROM information_schema.tables WHERE table_schema = '${this.connectionOptions.database}';`;
        const query3 = `SET FOREIGN_KEY_CHECKS = 1;`;

        return this.query(query1)
            .then(() => this.query<any[]>(query2))
            .then(results => {
                const dropQueries = results.map(q => this.query(q['q']));
                return Promise.all(dropQueries);
            })
            .then(() => this.query(query3))
            .then(() => {});
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void> {
        const qb = this.createQueryBuilder().update(tableName, valuesMap).from(tableName, "t");
        Object.keys(conditions).forEach(key => qb.andWhere(key + "=:" + key, { [key]: (<any> conditions)[key] }));
        return qb.execute().then(() => {});
    }

    /**
     * Insert a new row into given table.
     */
    insert(tableName: string, keyValues: Object): Promise<any> {
        const columns = Object.keys(keyValues).join(",");
        const values  = Object.keys(keyValues).map(key => (<any> keyValues)[key]).join(",");
        const query   = `INSERT INTO ${tableName}(${columns}) VALUES (${values})`;
        return this.query(query);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    delete(tableName: string, conditions: Object): Promise<void> {
        const qb = this.createQueryBuilder().delete(tableName);
        Object.keys(conditions).forEach(key => qb.andWhere(key + "=:" + key, { [key]: (<any> conditions)[key] }));
        return qb.execute().then(() => {});
    }

}