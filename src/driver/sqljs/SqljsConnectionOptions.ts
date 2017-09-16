import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Sqlite-specific connection options.
 */
export interface SqljsConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "sqljs";

    /**
     * The database definition and data to import
     */
    readonly databaseForImport: Uint8Array;
}