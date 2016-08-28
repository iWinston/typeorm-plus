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

}