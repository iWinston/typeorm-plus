import {DriverOptions} from "../driver/DriverOptions";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";
import {LoggerOptions} from "../logger/LoggerOptions";

/**
 * Connection's options.
 */
export interface ConnectionOptions {

    /**
     * Database options of this connection.
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
     * Be careful with this option and don't use this in production - otherwise you'll loose all production data.
     * This option is useful during debug and development.
     */
    readonly dropSchemaOnConnection?: boolean;

    /**
     * Indicates if database schema should be auto created on every application launch.
     * Be careful with this option and don't use this in production - otherwise you can loose production data.
     * This option is useful during debug and development.
     * Alternative to it, you can use CLI and run schema:sync command.
     */
    readonly autoSchemaCreate?: boolean;

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
     * Logging options.
     */
    readonly logging?: LoggerOptions;

}