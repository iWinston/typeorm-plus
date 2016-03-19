/**
 * Connection options passed to the document.
 */
export interface ConnectionOptions {

    /**
     * Url to where perform connection.
     */
    url?: string;

    /**
     * Database host.
     */
    host?: string;

    /**
     * Database host port.
     */
    port?: number;

    /**
     * Database username.
     */
    username?: string;

    /**
     * Database password.
     */
    password?: string;

    /**
     * Database name to connect to.
     */
    database?: string;

    /**
     * Indicates if database schema should be auto created every time application launch.
     */
    autoSchemaCreate?: boolean;

    /**
     * Logging options.
     */
    logging?: {

        /**
         * Some specific logger to be used. By default it console.
         */
        logger?: (message: any, level: string) => void;

        /**
         * Used if you want to log every executed query.
         */
        logQueries?: boolean;

        /**
         * Used if you want to log only failed query.
         */
        logOnlyFailedQueries?: boolean;

        /**
         * Used if you want to log error of the failed query.
         */
        logFailedQueryError?: boolean;
        
    };

}
