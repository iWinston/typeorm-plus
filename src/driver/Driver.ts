import {ConnectionOptions} from "../connection/ConnectionOptions";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Connection} from "../connection/Connection";

/**
 * Driver communicates with specific database.
 */
export interface Driver {

    /**
     * Access to the native implementation of the database.
     */
    native: any;

    /**
     * Gets database name to which this connection is made.
     */
    db: string;

    /**
     * Connection used in this driver.
     */
    connection: Connection;
    
    /**
     * Creates a query builder which can be used to build an sql queries.
     */
    createQueryBuilder<Entity>(): QueryBuilder<Entity>;
    
    /**
     * Creates a schema builder which can be used to build database/table schemas.
     */
    createSchemaBuilder(): SchemaBuilder;

    /**
     * Performs connection to the database based on given connection options.
     */
    connect(options: ConnectionOptions): Promise<void>;

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;

    /**
     * Executes a given SQL query.
     */
    query<T>(query: string): Promise<T>;

    /**
     * Clears all tables in the currently connected database.
     */
    clearDatabase(): Promise<void>;

    /**
     * Updates rows that match given conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void>;

    /**
     * Insert a new row into given table.
     */
    insert(tableName: string, valuesMap: Object): Promise<any>;

    /**
     * Insert a new row into given table.
     */
    delete(tableName: string, conditions: Object): Promise<void>;

}