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
    readonly database?: Uint8Array;

    /**
     * True if file or localStorage should be updated automatically
     */
    readonly autoSave?: boolean;

    /**
     * The interval in milliseconds
     */
    readonly autoSaveInterval?: number;

    /**
     * file path or local storage key to load and save database
     */
    readonly location?: string;
}