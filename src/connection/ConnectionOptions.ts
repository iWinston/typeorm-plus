import {DriverOptions} from "../driver/DriverOptions";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {LoggerOptions} from "../logger/LoggerOptions";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {DriverType} from "../driver/DriverType";

/**
 * ConnectionOptions is an interface with settings and options for specific connection.
 * Options contain database and other connection-related settings.
 * Consumer must provide connection options for each of your connections.
 */
export interface ConnectionOptions {

    /**
     * Connection name. If connection name is not given then it will be called "default".
     * Different connections must have different names.
     */
    name?: string;

    /**
     * Database options of this connection.
     *
     * @deprecated Define options right in the connection options section.
     */
    driver?: DriverOptions;

    /**
     * Database type. This value is required.
     */
    type?: DriverType;

    /**
     * Connection url to where perform connection to.
     */
    url?: string;

    /**
     * Database host.
     */
    host?: string;

    /**
     * Database host port.
     */
    port?: number;

    /**
     * Database username.
     */
    username?: string;

    /**
     * Database password.
     */
    password?: string;

    /**
     * Database name to connect to.
     */
    database?: string;

    /**
     * Schema name. By default is "public" (used only in Postgres databases).
     */
    schemaName?: string;

    /**
     * Connection SID (used for Oracle databases).
     */
    sid?: string;

    /**
     * Storage type or path to the storage (used for SQLite databases).
     */
    storage?: string;

    /**
     * Indicates if connection pooling should be used or not.
     * Be default it is enabled if its supported by a platform.
     * Set to false to disable it.
     *
     * @todo: rename to disablePool? What about mongodb pool?
     */
    usePool?: boolean;

    /**
     * Extra connection options to be passed to the underlying driver.
     */
    extra?: any;

    /**
     * Prefix to use on all tables (collections) of this connection in the database.
     *
     * @todo: rename to entityPrefix
     */
    tablesPrefix?: string;

    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    namingStrategy?: NamingStrategyInterface;

    /**
     * Entities to be loaded for this connection.
     * Accepts both entity classes and directories where from entities need to be loaded.
     * Directories support glob patterns.
     */
    entities?: Function[]|string[];

    /**
     * Subscribers to be loaded for this connection.
     * Accepts both subscriber classes and directories where from subscribers need to be loaded.
     * Directories support glob patterns.
     */
    subscribers?: Function[]|string[];

    /**
     * Entity schemas to be loaded for this connection.
     * Accepts both entity schema classes and directories where from entity schemas need to be loaded.
     * Directories support glob patterns.
     */
    entitySchemas?: EntitySchema[]|string[];

    /**
     * Migrations to be loaded for this connection.
     * Accepts both migration classes and directories where from migrations need to be loaded.
     * Directories support glob patterns.
     */
    migrations?: Function[]|string[];

    /**
     * Logging options.
     */
    logging?: LoggerOptions;

    /**
     * Drops the schema each time connection is being established.
     * Be careful with this option and don't use this in production - otherwise you'll loose all production data.
     * This option is useful during debug and development.
     */
    dropSchemaOnConnection?: boolean;

    /**
     * Indicates if database schema should be auto created on every application launch.
     * Be careful with this option and don't use this in production - otherwise you can loose production data.
     * This option is useful during debug and development.
     * Alternative to it, you can use CLI and run schema:sync command.
     *
     * Note that for MongoDB database it does not create schema, because MongoDB is schemaless.
     * Instead, it syncs just by creating indices.
     *
     * todo: rename it simply to synchronize: boolean ?
     */
    autoSchemaSync?: boolean;

    /**
     * Indicates if migrations should be auto run on every application launch.
     * Alternative to it, you can use CLI and run migration:create command.
     *
     * todo: rename it simply to runMigrations: boolean ?
     */
    autoMigrationsRun?: boolean;

    /**
     * Environment in which connection will run.
     * Current environment is determined from the environment NODE_ENV variable's value.
     * For example, if NODE_ENV is "test" and this property is set to "test",
     * then this connection will be created. On any other NODE_ENV value it will be skipped.
     * This option is specific to the configuration in the ormconfig.json file.
     */
    environment?: string;

    /**
     * CLI settings.
     */
    cli?: {

        /**
         * Directory where entities should be created by default.
         */
        entitiesDir?: string;

        /**
         * Directory where migrations should be created by default.
         */
        migrationsDir?: string;

        /**
         * Directory where subscribers should be created by default.
         */
        subscribersDir?: string;

    };

}