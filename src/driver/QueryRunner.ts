import {IndexMetadata} from "../metadata/IndexMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {ColumnSchema} from "../schema-builder/ColumnSchema";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {TableSchema} from "../schema-builder/TableSchema";

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
    insert(tableName: string, valuesMap: Object, idColumn?: ColumnMetadata): Promise<any>;

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
    loadSchemaTables(tableNames: string[]): Promise<TableSchema[]>;

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    createTable(table: TableMetadata, columns: ColumnMetadata[]): Promise<void>;

    /**
     * Creates a new column from the column metadata in the table.
     */
    createColumn(tableName: string, column: ColumnMetadata): Promise<void>;

    /**
     * Changes a column in the table.
     */
    changeColumn(tableName: string, oldColumn: ColumnSchema, newColumn: ColumnMetadata): Promise<void>;

    /**
     * Drops the column in the table.
     */
    dropColumn(tableName: string, columnName: string): Promise<void>;

    /**
     * Creates a new foreign.
     */
    createForeignKey(foreignKey: ForeignKeyMetadata): Promise<void>;

    /**
     * Drops a foreign key from the table.
     */
    dropForeignKey(tableName: string, foreignKeyName: string): Promise<void>;

    /**
     * Creates a new index.
     */
    createIndex(tableName: string, index: IndexMetadata): Promise<void>;

    /**
     * Drops an index from the table.
     */
    dropIndex(tableName: string, indexName: string): Promise<void>;

    /**
     * Creates a new unique key.
     */
    createUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void>;

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata): any;

}