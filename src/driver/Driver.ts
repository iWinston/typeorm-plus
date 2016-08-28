import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {DriverOptions} from "./DriverOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {DatabaseConnection} from "./DatabaseConnection";
import {QueryRunner} from "./QueryRunner";

/**
 * Driver organizes TypeORM communication with specific database management system.
 */
export interface Driver {

    /**
     * Connection options used in this driver.
     */
    readonly options: DriverOptions;

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void>;

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;

    /**
     * Retrieves a new database connection.
     * If pooling is enabled then connection from the pool will be retrieved.
     * Otherwise active connection will be returned.
     */
    retrieveDatabaseConnection(): Promise<DatabaseConnection>;

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     */
    releaseDatabaseConnection(dbConnection: DatabaseConnection): Promise<void>;

    /**
     * Creates a schema builder which can be used to build database/table schemas.
     */
    createSchemaBuilder(dbConnection: DatabaseConnection): SchemaBuilder;

    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase(dbConnection: DatabaseConnection): Promise<void>;

    /**
     * Starts transaction.
     */
    beginTransaction(dbConnection: DatabaseConnection): Promise<void>;

    /**
     * Commits transaction.
     */
    commitTransaction(dbConnection: DatabaseConnection): Promise<void>;

    /**
     * Ends transaction.
     */
    rollbackTransaction(dbConnection: DatabaseConnection): Promise<void>;

    /**
     * Executes a given SQL query and returns raw database results.
     */
    query(dbConnection: DatabaseConnection, query: string, parameters?: any[]): Promise<any>;

    /**
     * Updates rows that match given simple conditions in the given table.
     */
    update(dbConnection: DatabaseConnection, tableName: string, valuesMap: Object, conditions: Object): Promise<void>;

    /**
     * Inserts a new row into given table.
     */
    insert(dbConnection: DatabaseConnection, tableName: string, valuesMap: Object, idColumnName?: string): Promise<any>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(dbConnection: DatabaseConnection, tableName: string, conditions: Object): Promise<void>;

    /**
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(dbConnection: DatabaseConnection, tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

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

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface(): any;

    /**
     * Creates a query runner used for common queries.
     */
    createQueryRunner(): Promise<QueryRunner>;

}