import {LoggerOptions} from "../logger/LoggerOptions";
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
    logging?: LoggerOptions;

    /**
     * Extra connection options to be passed to the driver.
     */
    extra?: any;

}
