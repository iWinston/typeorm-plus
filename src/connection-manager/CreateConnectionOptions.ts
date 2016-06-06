import {ConnectionOptions} from "../connection/ConnectionOptions";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";

/**
 * All options to help to create a new connection.
 */
export interface CreateConnectionOptions {

    /**
     * Driver type. Mysql and postgres are the only drivers supported at this moment.
     */
    driver: "mysql"|"postgres";

    /**
     * Database connection options.
     */
    connection: ConnectionOptions;

    /**
     * Connection name. By default its called "default". Different connections must have different names.
     */
    connectionName?: string;

    /**
     * Name of the naming strategy or target class of the naming strategy to be used on this connection.
     */
    usedNamingStrategy?: string|Function;

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
     * Entity schemas to be loaded for the new connection.
     */
    entitySchemas?: EntitySchema[];

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

    /**
     * List of directories from where entity schemas will be loaded.
     */
    entitySchemaDirectories?: string[];
}