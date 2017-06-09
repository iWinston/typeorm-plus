import {DatabaseType} from "./DatabaseType";

/**
 * Connectivity options used to connect to the database, and other database-driver-specific options.
 *
 * @deprecated
 */
export interface DriverOptions {

    /**
     * Database type. This value is required.
     */
    type?: DatabaseType;

    /**
     * Connection url to where perform connection to.
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
     * Schema name. By default is "public" (used only in Postgres databases).
     */
    schemaName?: string;

    /**
     * Connection SID (used for Oracle databases).
     */
    sid?: string;

    /**
     * Storage type or path to the storage (used for SQLite databases).
     */
    storage?: string;

    /**
     * Extra connection options to be passed to the underlying driver.
     */
    extra?: any;

    /**
     * Prefix to use on all tables (collections) of this connection in the database.
     *
     * @todo: rename to entityPrefix
     */
    tablesPrefix?: string;

}
