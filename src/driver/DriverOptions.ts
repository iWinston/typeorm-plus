/**
 * Driver connection options.
 */
export interface DriverOptions {

    /**
     * Database type. Mysql and postgres are the only drivers supported at this moment.
     */
    type: "mysql"|"postgres";

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
     * Indicates if connection pooling should be used or not.
     * Be default it is enabled. Set to false to disable it.
     */
    usePool?: boolean;

    /**
     * Driver logging options.
     */
    logging?: {

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
        
    };

    /**
     * Extra connection options to be passed to the driver.
     */
    extra?: any;

}
