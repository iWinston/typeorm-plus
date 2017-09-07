import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {OracleConnectionCredentialsOptions} from "./OracleConnectionCredentialsOptions";

/**
 * Oracle-specific connection options.
 */
export interface OracleConnectionOptions extends BaseConnectionOptions, OracleConnectionCredentialsOptions {

    /**
     * Database type.
     */
    readonly type: "oracle";

    /**
     * Schema name. By default is "public".
     */
    readonly schema?: string;

    /**
     * @deprecated use "schema" instead.
     */
    readonly schemaName?: string;

    /**
     * Replication setup.
     */
    readonly replication?: {

        /**
         * List of read-from severs (slaves).
         */
        readonly read: OracleConnectionCredentialsOptions[];

        /**
         * Master server used by orm to perform writes.
         */
        readonly write: OracleConnectionCredentialsOptions;

    };

}