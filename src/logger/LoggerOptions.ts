export interface LoggerOptions {

    /**
     * Some specific logger to be used. By default it is a console.
     */
    logger?: (message: any, level: string) => void;

    /**
     * Set to true if you want to log every executed query.
     */
    logQueries?: boolean;

    /**
     * Set to true if you want to log only failed query.
     */
    logOnlyFailedQueries?: boolean;

    /**
     * Set to true if you want to log error of the failed query.
     */
    logFailedQueryError?: boolean;

}