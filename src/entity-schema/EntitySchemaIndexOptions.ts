export interface EntitySchemaIndexOptions {

    /**
     * Index column names.
     */
    columns?: string[];

    /**
     * Indicates if this index must be unique or not.
     */
    unique?: boolean;

    /**
     * Indicates if index must sync with database index.
     */
    synchronize?: boolean;

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    sparse?: boolean;

}