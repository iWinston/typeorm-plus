import {ConnectionOptions} from "../connection/ConnectionOptions";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Connection} from "../connection/Connection";
import {ColumnMetadata} from "../metadata-builder/metadata/ColumnMetadata";

/**
 * Driver communicates with specific database.
 */
export interface Driver {

    /**
     * Access to the native implementation of the database.
     */
    native: any;

    /**
     * Access to the connection of the native interface of the database.
     */
    nativeConnection: any;

    /**
     * Connection used in this driver.
     */
    connection: Connection;
    
    /**
     * Database name to which this connection is made.
     */
    db: string;
    
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
    connect(): Promise<void>;

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;

    /**
     * Executes a given SQL query and returns raw database results.
     */
    query<T>(query: string): Promise<T>;

    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase(): Promise<void>;

    /**
     * Updates rows that match given simple conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void>;

    /**
     * Inserts a new row into given table.
     */
    insert(tableName: string, valuesMap: Object): Promise<any>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tableName: string, conditions: Object): Promise<void>;
    
    /**
     * Starts transaction.
     */
    beginTransaction(): Promise<void>;
    
    /**
     * Ends transaction.
     */
    endTransaction(): Promise<void>;

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any;

    /**
     * Prepares given value to a value to be hydrated, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any;

    /**
     * Escapes given value.
     */
    escape(value: any): any;
    
}