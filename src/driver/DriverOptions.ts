import {LoggerOptions} from "../logger/LoggerOptions";
/**
 * Driver connection options.
 */
export interface DriverOptions {

    /**
     * Database type. Mysql and postgres are the only drivers supported at this moment.
     */
    readonly type: "mysql"|"postgres";

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
     * Indicates if connection pooling should be used or not.
     * Be default it is enabled. Set to false to disable it.
     */
    readonly usePool?: boolean;

    /**
     * Driver logging options.
     */
    readonly logging?: LoggerOptions;

    /**
     * Extra connection options to be passed to the driver.
     */
    readonly extra?: any;

}
