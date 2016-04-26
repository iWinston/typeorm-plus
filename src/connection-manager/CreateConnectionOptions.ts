import {ConnectionOptions} from "../connection/ConnectionOptions";

/**
 * All options to help to create a new connection.
 */
export interface CreateConnectionOptions {

    /**
     * Driver type. Mysql is the only driver supported at this moment.
     */
    driver: "mysql";

    /**
     * Database connection options.
     */
    connection: ConnectionOptions;

    /**
     * Connection name. By default its called "default". Different connections must have different names.
     */
    connectionName?: string;

    /**
     * Entities to be loaded for the new connection.
     */
    entities?: Function[];

    /**
     * Subscribers to be loaded for the new connection.
     */
    subscribers?: Function[];

    /**
     * Naming strategies to be loaded.
     */
    namingStrategies?: Function[];

    /**
     * List of directories from where entities will be loaded.
     */
    entityDirectories?: string[];

    /**
     * List of directories from where subscribers will be loaded.
     */
    subscriberDirectories?: string[];

    /**
     * List of directories from where naming strategies will be loaded.
     */
    namingStrategyDirectories?: string[];
}