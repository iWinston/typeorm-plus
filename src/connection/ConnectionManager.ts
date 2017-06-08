import {Connection} from "./Connection";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {ConnectionOptions} from "./ConnectionOptions";
import {AlreadyHasActiveConnectionError} from "./error/AlreadyHasActiveConnectionError";
import {OrmUtils} from "../util/OrmUtils";
import {CannotDetermineConnectionOptionsError} from "./error/CannotDetermineConnectionOptionsError";
import {PlatformTools} from "../platform/PlatformTools";

/**
 * ConnectionManager is used to store and manage all these different connections.
 * It also provides useful factory methods to simplify connection creation.
 */
export class ConnectionManager {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * List of connections registered in this connection manager.
     */
    protected connections: Connection[] = [];

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if connection with the given name exist in the manager.
     */
    has(name: string): boolean {
        return !!this.connections.find(connection => connection.name === name);
    }

    /**
     * Gets registered connection with the given name.
     * If connection name is not given then it will get a default connection.
     * Throws exception if connection with the given name was not found.
     */
    get(name: string = "default"): Connection {
        const connection = this.connections.find(connection => connection.name === name);
        if (!connection)
            throw new ConnectionNotFoundError(name);

        return connection;
    }

    /**
     * Creates a new connection based on the given connection options and registers it in the manager.
     * You need to manually call #connect method to establish connection.
     * Note that dropSchemaOnConnection and autoSchemaSync options of a ConnectionOptions will not work there - use
     * createAndConnect method to use them.
     */
    create(options: ConnectionOptions): Connection {

        // (backward compatibility) if options are set in the driver section of connection options then merge them into the option
        if (options.driver)
            Object.assign(options, options.driver);

        const existConnection = this.connections.find(connection => connection.name === (options.name || "default"));
        if (existConnection) {
            if (existConnection.isConnected)
                throw new AlreadyHasActiveConnectionError(options.name || "default");

            this.connections.splice(this.connections.indexOf(existConnection), 1);
        }

        const connection = new Connection(options);
        this.connections.push(connection);
        return connection;
    }

    /**
     * Creates a new connection and registers it in the manager.
     *
     * If connection options were not specified, then it will try to create connection automatically.
     *
     * First, it will try to find a "default" configuration from ormconfig.json.
     * You can also specify a connection name to use from ormconfig.json,
     * and you even can specify a path to custom ormconfig.json file.
     *
     * In the case if options were not specified, and ormconfig.json file also wasn't found,
     * it will try to create connection from environment variables.
     * There are several environment variables you can set:
     *
     * - TYPEORM_DRIVER_TYPE - driver type. Can be "mysql", "postgres", "mariadb", "sqlite", "oracle" or "mssql".
     * - TYPEORM_URL - database connection url. Should be a string.
     * - TYPEORM_HOST - database host. Should be a string.
     * - TYPEORM_PORT - database access port. Should be a number.
     * - TYPEORM_USERNAME - database username. Should be a string.
     * - TYPEORM_PASSWORD - database user's password. Should be a string.
     * - TYPEORM_SID - database's SID. Used only for oracle databases. Should be a string.
     * - TYPEORM_STORAGE - database's storage url. Used only for sqlite databases. Should be a string.
     * - TYPEORM_USE_POOL - indicates if connection pooling should be enabled. By default its enabled. Should be boolean-like value.
     * - TYPEORM_DRIVER_EXTRA - extra options to be passed to the driver. Should be a serialized json string of options.
     * - TYPEORM_AUTO_SCHEMA_SYNC - indicates if automatic schema synchronization will be performed on each application run. Should be boolean-like value.
     * - TYPEORM_ENTITIES - list of directories containing entities to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_SUBSCRIBERS - list of directories containing subscribers to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_ENTITY_SCHEMAS - list of directories containing entity schemas to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_NAMING_STRATEGIES - list of directories containing custom naming strategies to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_LOGGING_QUERIES - indicates if each executed query must be logged. Should be boolean-like value.
     * - TYPEORM_LOGGING_FAILED_QUERIES - indicates if logger should log failed query's error. Should be boolean-like value.
     * - TYPEORM_LOGGING_ONLY_FAILED_QUERIES - indicates if only failed queries must be logged. Should be boolean-like value.
     *
     * TYPEORM_DRIVER_TYPE variable is required. Depend on the driver type some other variables may be required too.
     */
    async createAndConnect(): Promise<Connection>;

    /**
     * Creates connection from the given connection options and registers it in the manager.
     */
    async createAndConnect(options: ConnectionOptions): Promise<Connection>;

    /**
     * Creates connection with the given connection name from the ormconfig.json file and registers it in the manager.
     * Optionally you can specify a path to custom ormconfig.json file.
     */
    async createAndConnect(connectionNameFromConfig: string, ormConfigPath?: string): Promise<Connection>;

    /**
     * Creates connection and and registers it in the manager.
     */
    async createAndConnect(optionsOrConnectionNameFromConfig?: ConnectionOptions|string, ormConfigPath?: string): Promise<Connection> {

        // if connection options are given, then create connection from them
        if (optionsOrConnectionNameFromConfig && optionsOrConnectionNameFromConfig instanceof Object)
            return this.createAndConnectByConnectionOptions(optionsOrConnectionNameFromConfig as ConnectionOptions);

        // if connection name is specified then explicitly try to load connection options from it
        if (typeof optionsOrConnectionNameFromConfig === "string")
            return this.createFromConfigAndConnect(optionsOrConnectionNameFromConfig || "default", ormConfigPath);

        // if nothing is specified then try to silently load config from ormconfig.json
        if (this.hasDefaultConfigurationInConfigurationFile())
            return this.createFromConfigAndConnect("default");

        // if driver type is set in environment variables then try to create connection from env variables
        if (this.hasDefaultConfigurationInEnvironmentVariables())
            return this.createFromEnvAndConnect();

        throw new CannotDetermineConnectionOptionsError();
    }

    /**
     * Creates new connections and registers them in the manager.
     *
     * If array of connection options were not specified, then it will try to create them automatically
     * from ormconfig.json. You can also specify path to your custom ormconfig.json file.
     *
     * In the case if options were not specified, and ormconfig.json file also wasn't found,
     * it will try to create connection from environment variables.
     * There are several environment variables you can set:
     *
     * - TYPEORM_DRIVER_TYPE - driver type. Can be "mysql", "postgres", "mariadb", "sqlite", "oracle" or "mssql".
     * - TYPEORM_URL - database connection url. Should be a string.
     * - TYPEORM_HOST - database host. Should be a string.
     * - TYPEORM_PORT - database access port. Should be a number.
     * - TYPEORM_USERNAME - database username. Should be a string.
     * - TYPEORM_PASSWORD - database user's password. Should be a string.
     * - TYPEORM_SID - database's SID. Used only for oracle databases. Should be a string.
     * - TYPEORM_STORAGE - database's storage url. Used only for sqlite databases. Should be a string.
     * - TYPEORM_USE_POOL - indicates if connection pooling should be enabled. By default its enabled. Should be boolean-like value.
     * - TYPEORM_DRIVER_EXTRA - extra options to be passed to the driver. Should be a serialized json string of options.
     * - TYPEORM_AUTO_SCHEMA_SYNC - indicates if automatic schema synchronization will be performed on each application run. Should be boolean-like value.
     * - TYPEORM_ENTITIES - list of directories containing entities to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_SUBSCRIBERS - list of directories containing subscribers to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_ENTITY_SCHEMAS - list of directories containing entity schemas to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_NAMING_STRATEGIES - list of directories containing custom naming strategies to load. Should be string - directory names (can be patterns) split by a comma.
     * - TYPEORM_LOGGING_QUERIES - indicates if each executed query must be logged. Should be boolean-like value.
     * - TYPEORM_LOGGING_FAILED_QUERIES - indicates if logger should log failed query's error. Should be boolean-like value.
     * - TYPEORM_LOGGING_ONLY_FAILED_QUERIES - indicates if only failed queries must be logged. Should be boolean-like value.
     *
     * TYPEORM_DRIVER_TYPE variable is required. Depend on the driver type some other variables may be required too.
     */
    async createAndConnectToAll(): Promise<Connection[]>;

    /**
     * Creates connections from the given connection options and registers them in the manager.
     */
    async createAndConnectToAll(options?: ConnectionOptions[]): Promise<Connection[]>;

    /**
     * Creates connections from the ormconfig.json file.
     * Optionally you can specify a path to custom ormconfig.json file.
     */
    async createAndConnectToAll(ormConfigPath?: string): Promise<Connection[]>;

    /**
     * Creates connections and and registers them in the manager.
     */
    async createAndConnectToAll(optionsOrOrmConfigFilePath?: ConnectionOptions[]|string): Promise<Connection[]> {

        // if connection options are given, then create connection from them
        if (optionsOrOrmConfigFilePath && optionsOrOrmConfigFilePath instanceof Array)
            return Promise.all(optionsOrOrmConfigFilePath.map(options => {
                return this.createAndConnectByConnectionOptions(options as ConnectionOptions);
            }));

        // if connection name is specified then explicitly try to load connection options from it
        if (typeof optionsOrOrmConfigFilePath === "string")
            return this.createFromConfigAndConnectToAll(optionsOrOrmConfigFilePath as string);

        // if nothing is specified then try to silently load config from ormconfig.json
        if (this.hasOrmConfigurationFile())
            return this.createFromConfigAndConnectToAll();

        // if driver type is set in environment variables then try to create connection from env variables
        if (this.hasDefaultConfigurationInEnvironmentVariables())
            return [await this.createFromEnvAndConnect()];

        throw new CannotDetermineConnectionOptionsError();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if ormconfig.json exists.
     */
    protected hasOrmConfigurationFile(): boolean {
        const path = PlatformTools.load("app-root-path").path + "/ormconfig.json";
        if (!PlatformTools.fileExist(path))
            return false;

        const configuration: ConnectionOptions[]|ConnectionOptions = PlatformTools.load(path);
        if (configuration instanceof Array) {
            return configuration
                    .filter(options => !options.environment || options.environment === PlatformTools.getEnvVariable("NODE_ENV"))
                    .length > 0;

        } else if (configuration instanceof Object) {
            if (configuration.environment && configuration.environment !== PlatformTools.getEnvVariable("NODE_ENV"))
                return false;

            return Object.keys(configuration).length > 0;
        }

        return false;
    }

    /**
     * Checks if there is a default connection in the ormconfig.json file.
     */
    protected hasDefaultConfigurationInConfigurationFile(): boolean {
        const path = PlatformTools.load("app-root-path").path + "/ormconfig.json";
        if (!PlatformTools.fileExist(path))
            return false;

        const configuration: ConnectionOptions[]|ConnectionOptions = PlatformTools.load(path);
        if (configuration instanceof Array) {
            return !!configuration
                .filter(options => !options.environment || options.environment === PlatformTools.getEnvVariable("NODE_ENV"))
                .find(config => !!config.name || config.name === "default");

        } else if (configuration instanceof Object) {
            if (!configuration.name ||
                configuration.name !== "default")
                return false;

            if (configuration.environment && configuration.environment !== PlatformTools.getEnvVariable("NODE_ENV"))
                return false;

            return true;
        }

        return false;
    }

    /**
     * Checks if environment variables contains connection options.
     */
    protected hasDefaultConfigurationInEnvironmentVariables(): boolean {
        return !!PlatformTools.getEnvVariable("TYPEORM_DRIVER_TYPE");
    }

    /**
     * Allows to quickly create a connection based on the environment variable values.
     */
    protected async createFromEnvAndConnect(): Promise<Connection> {
        return this.createAndConnectByConnectionOptions({
            type: PlatformTools.getEnvVariable("TYPEORM_DRIVER_TYPE"),
            url: PlatformTools.getEnvVariable("TYPEORM_URL"),
            host: PlatformTools.getEnvVariable("TYPEORM_HOST"),
            port: PlatformTools.getEnvVariable("TYPEORM_PORT"),
            username: PlatformTools.getEnvVariable("TYPEORM_USERNAME"),
            password: PlatformTools.getEnvVariable("TYPEORM_PASSWORD"),
            database: PlatformTools.getEnvVariable("TYPEORM_DATABASE"),
            sid: PlatformTools.getEnvVariable("TYPEORM_SID"),
            extra: PlatformTools.getEnvVariable("TYPEORM_DRIVER_EXTRA") ? JSON.parse(PlatformTools.getEnvVariable("TYPEORM_DRIVER_EXTRA")) : undefined,
            autoSchemaSync: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_AUTO_SCHEMA_SYNC")),
            entities: PlatformTools.getEnvVariable("TYPEORM_ENTITIES") ? PlatformTools.getEnvVariable("TYPEORM_ENTITIES").split(",") : [],
            subscribers: PlatformTools.getEnvVariable("TYPEORM_SUBSCRIBERS") ? PlatformTools.getEnvVariable("TYPEORM_SUBSCRIBERS").split(",") : [],
            entitySchemas: PlatformTools.getEnvVariable("TYPEORM_ENTITY_SCHEMAS") ? PlatformTools.getEnvVariable("TYPEORM_ENTITY_SCHEMAS").split(",") : [],
            logging: {
                logQueries: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_LOGGING_QUERIES")),
                logFailedQueryError: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_LOGGING_FAILED_QUERIES")),
                logOnlyFailedQueries: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_LOGGING_ONLY_FAILED_QUERIES")),
            }
        });
    }


    /**
     * Creates a new connection based on the connection options from "ormconfig.json"
     * and registers a new connection in the manager.
     * Optionally you can specify a path to the json configuration.
     * If path is not given, then ormconfig.json file will be searched near node_modules directory.
     */
    protected async createFromConfigAndConnectToAll(path?: string): Promise<Connection[]> {
        let optionsArray: ConnectionOptions[] = PlatformTools.load(path || (PlatformTools.load("app-root-path").path + "/ormconfig.json"));
        if (!(optionsArray instanceof Array)) optionsArray = [optionsArray]; // cast options to array if ormconfig contains a single connection options object
        if (!optionsArray)
            throw new Error(`Configuration ${path || "ormconfig.json"} was not found. Add connection configuration inside ormconfig.json file.`);

        const promises = optionsArray
            .filter(options => !options.environment || options.environment === PlatformTools.getEnvVariable("NODE_ENV")) // skip connection creation if environment is set in the options, and its not equal to the value in the NODE_ENV variable
            .map(options => this.createAndConnectByConnectionOptions(options));

        return Promise.all(promises);
    }

    /**
     * Creates a new connection based on the connection options from "ormconfig.json"
     * and registers a new connection in the manager.
     * Optionally you can specify a path to the json configuration.
     * If path is not given, then ormconfig.json file will be searched near node_modules directory.
     */
    protected async createFromConfigAndConnect(connectionName: string, path?: string): Promise<Connection> {
        let optionsArray: ConnectionOptions[] = PlatformTools.load(path || (PlatformTools.load("app-root-path").path + "/ormconfig.json"));
        if (!(optionsArray instanceof Array)) optionsArray = [optionsArray]; // cast options to array if ormconfig contains a single connection options object
        if (!optionsArray)
            throw new Error(`Configuration ${path || "ormconfig.json"} was not found. Add connection configuration inside ormconfig.json file.`);

        const environmentLessOptions = optionsArray.filter(options => (options.name || "default") === connectionName);
        const options = environmentLessOptions.find(options => !options.environment || options.environment === PlatformTools.getEnvVariable("NODE_ENV")); // skip connection creation if environment is set in the options, and its not equal to the value in the NODE_ENV variable

        if (!options)
            throw new Error(`Connection "${connectionName}" ${PlatformTools.getEnvVariable("NODE_ENV") ? "for the environment " + PlatformTools.getEnvVariable("NODE_ENV") + " " : ""}was not found in the json configuration file.` +
                (environmentLessOptions.length ? ` However there are such configurations for other environments: ${environmentLessOptions.map(options => options.environment).join(", ")}.` : ""));

        let connectionOptions: ConnectionOptions = Object.assign({}, options);
        // normalize directory paths
        if (options.entities) {
            const entities = (options.entities as any[]).map(entity => {
                if (typeof entity === "string" || entity.substr(0, 1) !== "/")
                    return PlatformTools.load("app-root-path").path + "/" + entity;

                return entity;
            });
            Object.assign(connectionOptions, { entities: entities });
        }
        if (options.subscribers) {
            const subscribers = (options.subscribers as any[]).map(subscriber => {
                if (typeof subscriber === "string" || subscriber.substr(0, 1) !== "/")
                    return PlatformTools.load("app-root-path").path + "/" + subscriber;

                return subscriber;
            });
            Object.assign(connectionOptions, { subscribers: subscribers });
        }
        if (options.migrations) {
            const migrations = (options.migrations as any[]).map(migration => {
                if (typeof migration === "string" || migration.substr(0, 1) !== "/")
                    return PlatformTools.load("app-root-path").path + "/" + migration;

                return migration;
            });
            Object.assign(connectionOptions, { migrations: migrations });
        }

        return this.createAndConnectByConnectionOptions(options);
    }

    /**
     * Creates a new connection based on the given connection options and registers a new connection in the manager.
     */
    protected async createAndConnectByConnectionOptions(options: ConnectionOptions): Promise<Connection> {
        const connection = this.create(options);

        // connect to the database
        await connection.connect();

        // if option is set - drop schema once connection is done
        if (options.dropSchemaOnConnection && !PlatformTools.getEnvVariable("SKIP_SCHEMA_CREATION"))
            await connection.dropDatabase();

        // if option is set - automatically synchronize a schema
        if (options.autoSchemaSync && !PlatformTools.getEnvVariable("SKIP_SCHEMA_CREATION"))
            await connection.syncSchema();

        // if option is set - automatically synchronize a schema
        if (options.autoMigrationsRun && !PlatformTools.getEnvVariable("SKIP_MIGRATIONS_RUN"))
            await connection.runMigrations();

        return connection;
    }

}
