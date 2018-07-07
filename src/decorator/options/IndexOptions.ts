/**
 * Describes all index options.
 */
export interface IndexOptions {

    /**
     * Indicates if this composite index must be unique or not.
     */
    unique?: boolean;

    /**
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL and PostgreSQL.
     */
    spatial?: boolean;

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Works only in MySQL.
     */
    fulltext?: boolean;

    /**
     * Index filter condition.
     */
    where?: string;

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    sparse?: boolean;

}
