import {ColumnSchema} from "../schema-builder/database-schema/ColumnSchema";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {TableSchema} from "../schema-builder/database-schema/TableSchema";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ForeignKeySchema} from "../schema-builder/database-schema/ForeignKeySchema";
import {IndexSchema} from "../schema-builder/database-schema/IndexSchema";

/**
 * Runs queries on a single database connection.
 */
export interface QueryRunner {

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     * You cannot use this class's methods after its released.
     */
    release(): Promise<void>;

    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase(): Promise<void>;

    /**
     * Starts transaction.
     */
    beginTransaction(): Promise<void>;

    /**
     * Commits transaction.
     */
    commitTransaction(): Promise<void>;

    /**
     * Ends transaction.
     */
    rollbackTransaction(): Promise<void>;

    /**
     * Checks if transaction is in progress.
     */
    isTransactionActive(): boolean;

    /**
     * Executes a given SQL query and returns raw database results.
     */
    query(query: string, parameters?: any[]): Promise<any>;

    /**
     * Updates rows that match given simple conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void>;

    /**
     * Inserts a new row into given table.
     */
    insert(tableName: string, valuesMap: Object, generatedColumn?: ColumnMetadata): Promise<any>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tableName: string, conditions: Object): Promise<void>;

    /**
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    loadSchemaTables(tableNames: string[], namingStrategy: NamingStrategyInterface): Promise<TableSchema[]>;

    /**
     * Creates a new table from the given table metadata and column metadatas.
     * Returns array of created columns. This is required because some driver may not create all columns.
     */
    createTable(table: TableMetadata, columns: ColumnMetadata[]): Promise<ColumnMetadata[]>;

    /**
     * Creates new columns in the table.
     */
    createColumns(tableSchema: TableSchema, columns: ColumnMetadata[]): Promise<ColumnMetadata[]>;

    /**
     * Changes a columns in the table.
     */
    changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnMetadata, oldColumn: ColumnSchema }[]): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    dropColumns(dbTable: TableSchema, columns: ColumnSchema[]): Promise<void>;

    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(dbTable: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(tableSchema: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Creates a new index.
     */
    createIndex(index: IndexSchema): Promise<void>;

    /**
     * Drops an index from the table.
     */
    dropIndex(tableName: string, indexName: string): Promise<void>;

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata): any;

}