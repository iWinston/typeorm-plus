import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Sqlite-specific connection options.
 */
export interface NativescriptConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "nativescript";

    /**
     * Database name.
     */
    readonly database: string;

}