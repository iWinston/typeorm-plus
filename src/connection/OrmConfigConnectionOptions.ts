import {ConnectionOptions} from "./ConnectionOptions";

/**
 * Adds few extra connection options to the original ConnectionOptions.
 * These options are specific to the configuration in the ormconfig.json file.
 */
export interface OrmConfigConnectionOptions extends ConnectionOptions {

    /**
     * Environment in which this connection will run.
     * Environment is based on the NODE_ENV variable's value.
     * For example, if NODE_ENV is "test" and this property is set to "test",
     * then this connection will be created, otherwise on any other NODE_ENV value it will be skipped.
     */
    readonly environment?: string;

}