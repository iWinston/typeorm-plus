import {DriverOptions} from "../driver/DriverOptions";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";
import {LoggerOptions} from "../logger/LoggerOptions";

/**
 * New connection options.
 */
export interface ConnectionOptions {

    /**
     * Database connection options.
     */
    readonly driver: DriverOptions;

    /**
     * Connection name. If connection name is not given then it will be called "default".
     * Different connections must have different names.
     */
    readonly name?: string;

    /**
     * Name of the naming strategy or target class of the naming strategy to be used for this connection.
     */
    readonly usedNamingStrategy?: string|Function;

    /**
     * Drops the schema each time connection is being established.
     * Be careful with this option and don't use this in production - otherwise you'll loose all your production data.
     * This option is useful during debug and development.
     */
    readonly dropSchemaOnConnection?: boolean;

    /**
     * Indicates if database schema should be auto created on every application launch.
     */
    readonly autoSchemaCreate?: boolean;

    /**
     * Driver logging options.
     */
    readonly logging?: LoggerOptions;

    /**
     * Entities to be loaded for the this connection.
     */
    readonly entities?: Function[]|string[];

    /**
     * Subscribers to be loaded for the this connection.
     */
    readonly subscribers?: Function[]|string[];

    /**
     * Naming strategies to be loaded for the this connection.
     */
    readonly namingStrategies?: Function[]|string[];

    /**
     * Entity schemas to be loaded for the this connection.
     */
    readonly entitySchemas?: EntitySchema[]|string[];

    /**
     * List of files with entities from where they will be loaded.
     * Glob patterns are supported.
     *
     * @deprecated
     */
    // readonly entities?: string[];

    /**
     * List of files with subscribers from where they will be loaded.
     * Glob patterns are supported.
     *
     * @deprecated
     */
    // readonly subscribers?: string[];

    /**
     * List of files with naming strategies from where they will be loaded.
     * Glob patterns are supported.
     *
     * @deprecated
     */
    // readonly namingStrategyDirectories?: string[];

    /**
     * List of files with entity schemas from where they will be loaded.
     * Glob patterns are supported.
     *
     * @deprecated
     */
    // readonly entitySchemaDirectories?: string[];

    /**
     * Environment in which this connection will run.
     * Environment is based on the NODE_ENV variable's value.
     * For example, if NODE_ENV is "test" and this property is set to "test",
     * then this connection will be created, otherwise on any other NODE_ENV value it will be skipped.
     */
    readonly environment?: string;

}