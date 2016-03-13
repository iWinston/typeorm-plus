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

}
