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
     * Environment in which connection will run.
     * Current environment is determined from the environment NODE_ENV variable's value.
     * For example, if NODE_ENV is "test" and this property is set to "test",
     * then this connection will be created. On any other NODE_ENV value it will be skipped.
     * This option is specific to the configuration in the ormconfig.json file.
     */
    readonly environment?: string;

}