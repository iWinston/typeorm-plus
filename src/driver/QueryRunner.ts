import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";

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

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]];

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string;

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string;

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string;

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any;

    /**
     * Prepares given value to a value to be hydrated, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any;
    
}