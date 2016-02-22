import {ConnectionOptions} from "../connection/ConnectionOptions";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
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
     * Creates a query builder which can be used to build an sql queries.
     */
    createQueryBuilder<Entity>(connection: Connection): QueryBuilder<Entity>;
    
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

}