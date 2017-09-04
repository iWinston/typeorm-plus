import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Sqlite-specific connection options.
 */
export interface CordovaSqliteConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "cordova-sqlite";

    /**
     * Database name.
     */
    readonly database: string;

    /**
     * Storage Location
     */
    readonly location: string;
}