import {DriverOptions} from "../driver/DriverOptions";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";

/**
 * New connection options.
 */
export interface ConnectionOptions {

    /**
     * Driver type. Mysql and postgres are the only drivers supported at this moment.
     */
    driver: "mysql"|"postgres";

    /**
     * Database connection options.
     */
    driverOptions: DriverOptions;

    /**
     * Connection name. By default its called "default". Different connections must have different names.
     */
    connectionName?: string;

    /**
     * Name of the naming strategy or target class of the naming strategy to be used on this connection.
     */
    usedNamingStrategy?: string|Function;

    /**
     * Drops the schema each time connection is being established.
     * Be careful with this option and don't use this in production - otherwise you'll loose all your production data.
     * This option is useful during debug and development.
     */
    dropSchemaOnConnection?: boolean;

    /**
     * Indicates if database schema should be auto created every time application launch.
     */
    autoSchemaCreate?: boolean;

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