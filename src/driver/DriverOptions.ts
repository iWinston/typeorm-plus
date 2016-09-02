/**
 * Driver connection options.
 */
export interface DriverOptions {

    /**
     * Database type. Mysql and postgres are the only drivers supported at this moment.
     */
    readonly type: "mysql"|"postgres"|"mariadb"|"sqlite";

    /**
     * Url to where perform connection.
     */
    readonly url?: string;

    /**
     * Database host.
     */
    readonly host?: string;

    /**
     * Database host port.
     */
    readonly port?: number;

    /**
     * Database username.
     */
    readonly username?: string;

    /**
     * Database password.
     */
    readonly password?: string;

    /**
     * Database name to connect to.
     */
    readonly database?: string;

    /**
     * Storage type or path to the storage.
     * Used only for SQLite.
     */
    readonly storage?: string;

    /**
     * Indicates if connection pooling should be used or not.
     * Be default it is enabled. Set to false to disable it.
     */
    readonly usePool?: boolean;

    /**
     * Extra connection options to be passed to the driver.
     */
    readonly extra?: any;

}
