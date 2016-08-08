import {DriverOptions} from "../driver/DriverOptions";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";

/**
 * New connection options.
 */
export interface ConnectionOptions {

    /**
     * Database connection options.
     */
    driver: DriverOptions;

    /**
     * Connection name. If connection name is not given then it will be called "default".
     * Different connections must have different names.
     */
    connectionName?: string;

    /**
     * Name of the naming strategy or target class of the naming strategy to be used for this connection.
     */
    usedNamingStrategy?: string|Function;

    /**
     * Drops the schema each time connection is being established.
     * Be careful with this option and don't use this in production - otherwise you'll loose all your production data.
     * This option is useful during debug and development.
     */
    dropSchemaOnConnection?: boolean;

    /**
     * Indicates if database schema should be auto created on every application launch.
     */
    autoSchemaCreate?: boolean;

    /**
     * Entities to be loaded for the this connection.
     */
    entities?: Function[];

    /**
     * Subscribers to be loaded for the this connection.
     */
    subscribers?: Function[];

    /**
     * Naming strategies to be loaded for the this connection.
     */
    namingStrategies?: Function[];

    /**
     * Entity schemas to be loaded for the this connection.
     */
    entitySchemas?: EntitySchema[];

    /**
     * List of files with entities from where they will be loaded.
     * Glob patterns are supported.
     */
    entityDirectories?: string[];

    /**
     * List of files with subscribers from where they will be loaded.
     * Glob patterns are supported.
     */
    subscriberDirectories?: string[];

    /**
     * List of files with naming strategies from where they will be loaded.
     * Glob patterns are supported.
     */
    namingStrategyDirectories?: string[];

    /**
     * List of files with entity schemas from where they will be loaded.
     * Glob patterns are supported.
     */
    entitySchemaDirectories?: string[];

}