import {IndexMetadata} from "../metadata/IndexMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {ColumnSchema} from "../schema-creator/ColumnSchema";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {TableSchema} from "../schema-creator/TableSchema";

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
    insert(tableName: string, valuesMap: Object, idColumnName?: string): Promise<any>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tableName: string, conditions: Object): Promise<void>;

    /**
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

    loadSchemaTables(tableNames: string[]): Promise<TableSchema[]>;
    createTable(table: TableMetadata, columns: ColumnMetadata[]): Promise<void>;
    createColumn(tableName: string, column: ColumnMetadata): Promise<void>;
    changeColumn(tableName: string, oldColumn: ColumnSchema, newColumn: ColumnMetadata): Promise<void>;
    dropColumn(tableName: string, columnName: string): Promise<void>;
    createForeignKey(foreignKey: ForeignKeyMetadata): Promise<void>;
    dropForeignKey(tableName: string, foreignKeyName: string): Promise<void>;
    createIndex(tableName: string, index: IndexMetadata): Promise<void>;
    dropIndex(tableName: string, indexName: string): Promise<void>;
    createUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void>;
    normalizeType(column: ColumnMetadata): any;

}