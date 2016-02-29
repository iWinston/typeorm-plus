import {Driver} from "./Driver";
import {ConnectionOptions} from "../connection/ConnectionOptions";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {MysqlSchemaBuilder} from "../schema-builder/MysqlSchemaBuilder";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {Connection} from "../connection/Connection";

/**
 * This driver organizes work with mysql database.
 */
export class MysqlDriver implements Driver {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private mysql: any;
    private connection: any;
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
    createQueryBuilder<Entity>(connection: Connection): QueryBuilder<Entity> {
        return new QueryBuilder<Entity>(connection);
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
        this.connection = this.mysql.createConnection({
            host: options.host,
            user: options.username,
            password: options.password,
            database: options.database
        });
        return new Promise<void>((ok, fail) => this.connection.connect((err: any) => err ? fail(err) : ok()));
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.connection) 
            throw new Error("Connection is not established, cannot disconnect.");
        
        return new Promise<void>((ok, fail) => {
            this.connection.end((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string): Promise<T> {
        if (!this.connection) throw new Error("Connection is not established, cannot execute a query.");
        console.info("executing:", query);
        return new Promise<any>((ok, fail) => this.connection.query(query, (err: any, result: any) => err ? fail(err) : ok(result)));
    }

}