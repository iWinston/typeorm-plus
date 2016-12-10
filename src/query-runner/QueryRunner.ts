import {ColumnSchema} from "../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {TableSchema} from "../schema-builder/schema/TableSchema";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ForeignKeySchema} from "../schema-builder/schema/ForeignKeySchema";
import {IndexSchema} from "../schema-builder/schema/IndexSchema";

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
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
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
    delete(tableName: string, condition: string, parameters?: any[]): Promise<void>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tableName: string, conditions: Object): Promise<void>;

    /**
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

    /**
     * Converts a column type of the metadata to the database column's type.
     */
    normalizeType(column: ColumnMetadata): any;

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    loadTableSchema(tableName: string, namingStrategy: NamingStrategyInterface): Promise<TableSchema|undefined>;

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    loadTableSchemas(tableNames: string[], namingStrategy: NamingStrategyInterface): Promise<TableSchema[]>;

    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(table: TableSchema): Promise<boolean>;

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    createTable(table: TableSchema): Promise<void>;

    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(table: TableSchema, columnName: string): Promise<boolean>;

    /**
     * Creates a new column in the table.
     */
    addColumn(tableSchema: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Creates new columns in the table.
     */
    addColumns(tableSchema: TableSchema, columns: ColumnSchema[]): Promise<void>;

    // todo: renameColumn ?

    /**
     * Changes a column in the table.
     */
    changeColumn(tableSchema: TableSchema, newColumn: ColumnSchema, oldColumn: ColumnSchema): Promise<void>;

    /**
     * Changes a columns in the table.
     */
    changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void>;

    /**
     * Drops the column in the table.
     */
    dropColumn(dbTable: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    dropColumns(dbTable: TableSchema, columns: ColumnSchema[]): Promise<void>;

    /**
     * Updates primary keys in the table.
     */
    updatePrimaryKeys(dbTable: TableSchema): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    createForeignKey(dbTable: TableSchema, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(dbTable: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKey(tableSchema: TableSchema, foreignKey: ForeignKeySchema): Promise<void>;

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

}