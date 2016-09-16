import {Connection} from "./Connection";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";
import {ConnectionOptions} from "./ConnectionOptions";
import {DriverOptions} from "../driver/DriverOptions";
import {Driver} from "../driver/Driver";
import {MissingDriverError} from "./error/MissingDriverError";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {AlreadyHasActiveConnectionError} from "./error/AlreadyHasActiveConnectionError";
import {Logger} from "../logger/Logger";
import {SqliteDriver} from "../driver/sqlite/SqliteDriver";
import {OracleDriver} from "../driver/oracle/OracleDriver";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {OrmConfigConnectionOptions} from "./OrmConfigConnectionOptions";

/**
 * Connection manager holds all connections made to the databases and providers helper management functions 
 * for all exist connections.
 */
export class ConnectionManager {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * List of connections registered in this connection manager.
     */
    private connections: Connection[] = [];
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new connection based on the connection options from "ormconfig.json"
     * and registers a new connection in the manager.
     * Optionally you can specify a path to the json configuration.
     * If path is not given, then ormconfig.json file will be searched near node_modules directory.
     */
    async createFromConfigAndConnectToAll(path?: string): Promise<Connection[]> {
        const optionsArray: OrmConfigConnectionOptions[] = require(path || (require("app-root-path").path + "/ormconfig.json"));
        if (!optionsArray)
            throw new Error(`Configuration ${path || "ormconfig.json"} was not found. Add connection configuration inside ormconfig.json file.`);

        const promises = optionsArray
            .filter(options => !options.environment || options.environment === process.env.NODE_ENV) // skip connection creation if environment is set in the options, and its not equal to the value in the NODE_ENV variable
            .map(options => this.createAndConnect(options));

        return Promise.all(promises);
    }

    /**
     * Creates a new connection based on the connection options from "ormconfig.json"
     * and registers a new connection in the manager.
     * Optionally you can specify a path to the json configuration.
     * If path is not given, then ormconfig.json file will be searched near node_modules directory.
     */
    async createFromConfigAndConnect(connectionName: string = "default", path?: string): Promise<Connection> {
        const optionsArray: OrmConfigConnectionOptions[] = require(path || (require("app-root-path").path + "/ormconfig.json"));
        if (!optionsArray)
            throw new Error(`Configuration ${path || "ormconfig.json"} was not found. Add connection configuration inside ormconfig.json file.`);

        const environmentLessOptions = optionsArray.filter(options => (options.name || "default") === connectionName);
        const options = environmentLessOptions.filter(options => !options.environment || options.environment === process.env.NODE_ENV); // skip connection creation if environment is set in the options, and its not equal to the value in the NODE_ENV variable

        if (!options.length)
            throw new Error(`Connection "${connectionName}" ${process.env.NODE_ENV ? "for the environment " + process.env.NODE_ENV + " " : ""}was not found in the json configuration file.` +
                (environmentLessOptions.length ? ` However there are such configurations for other environments: ${environmentLessOptions.map(options => options.environment).join(", ")}.` : ""));

        return this.createAndConnect(options[0]);
    }

    /**
     * Allows to quickly create a connection based on the environment variable values.
     */
    async createFromEnvAndConnect(): Promise<Connection> {
        return this.createAndConnect({
            driver: {
                type: process.env.TYPEORM_DRIVER_TYPE,
                url: process.env.TYPEORM_URL,
                host: process.env.TYPEORM_HOST,
                port: process.env.TYPEORM_PORT,
                username: process.env.TYPEORM_USERNAME,
                password: process.env.TYPEORM_PASSWORD,
                database: process.env.TYPEORM_DATABASE,
                sid: process.env.TYPEORM_SID,
                storage: process.env.TYPEORM_STORAGE,
                extra: process.env.TYPEORM_DRIVER_EXTRA ? JSON.parse(process.env.TYPEORM_DRIVER_EXTRA) : undefined
            },
            autoSchemaCreate: process.env.TYPEORM_AUTO_SCHEMA_CREATE,
            entities: process.env.TYPEORM_ENTITIES ? process.env.TYPEORM_ENTITIES.split(",") : [],
            subscribers: process.env.TYPEORM_SUBSCRIBERS ? process.env.TYPEORM_SUBSCRIBERS.split(",") : [],
            entitySchemas: process.env.TYPEORM_ENTITY_SCHEMAS ? process.env.TYPEORM_ENTITY_SCHEMAS.split(",") : [],
            namingStrategies: process.env.TYPEORM_NAMING_STRATEGIES ? process.env.TYPEORM_NAMING_STRATEGIES.split(",") : [],
            usedNamingStrategy: process.env.TYPEORM_USED_NAMING_STRATEGY,
            logging: {
                logQueries: process.env.TYPEORM_LOGGING_QUERIES,
                logFailedQueryError: process.env.TYPEORM_LOGGING_FAILED_QUERIES,
                logOnlyFailedQueries: process.env.TYPEORM_LOGGING_ONLY_FAILED_QUERIES,
            }
        });
    }

    /**
     * Creates a new connection based on the given connection options and registers a new connection in the manager.
     */
    async createAndConnect(options: ConnectionOptions): Promise<Connection> {
        const connection = this.create(options);

        // connect to the database
        await connection.connect();

        // if option is set - drop schema once connection is done
        if (options.dropSchemaOnConnection && !process.env.SKIP_SCHEMA_CREATION)
            await connection.dropDatabase();

        // if option is set - automatically synchronize a schema
        if (options.autoSchemaCreate && !process.env.SKIP_SCHEMA_CREATION)
            await connection.syncSchema();

        return connection;
    }

    /**
     * Creates a new connection based on the given connection options and registers this connection in the manager.
     * Note that dropSchemaOnConnection and autoSchemaCreate options of a ConnectionOptions are not working there - use
     * createAndConnect method to use them.
     */
    create(options: ConnectionOptions): Connection {

        const logger = new Logger(options.logging || {});
        const driver = this.createDriver(options.driver, logger);
        const connection = this.createConnection(options.name || "default", driver, logger);

        if (options.entitySchemas) {
            const [directories, classes] = this.splitStringsAndFunctions(options.entitySchemas);
            connection
                .importEntitySchemas(classes)
                .importEntitySchemaFromDirectories(directories);
        }

        if (options.entities) {
            const [directories, classes] = this.splitStringsAndFunctions(options.entities);
            connection
                .importEntities(classes)
                .importEntitiesFromDirectories(directories);
        }

        if (options.subscribers) {
            const [directories, classes] = this.splitStringsAndFunctions(options.subscribers);
            connection
                .importSubscribers(classes)
                .importSubscribersFromDirectories(directories);
        }

        if (options.namingStrategies) {
            const [directories, classes] = this.splitStringsAndFunctions(options.namingStrategies);
            connection
                .importNamingStrategies(classes)
                .importNamingStrategiesFromDirectories(directories);
        }

        if (options.usedNamingStrategy && typeof options.usedNamingStrategy === "string")
            connection.useNamingStrategy(options.usedNamingStrategy);
        
        if (options.usedNamingStrategy && options.usedNamingStrategy instanceof Function)
            connection.useNamingStrategy(options.usedNamingStrategy);

        return connection;
    }

    /**
     * Gets registered connection with the given name.
     * If connection name is not given then it will get a default connection.
     */
    get(name: string = "default"): Connection {
        const connection = this.connections.find(connection => connection.name === name);
        if (!connection)
            throw new ConnectionNotFoundError(name);

        return connection;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Splits given array of mixed strings and / or functions into two separate array of string and array of functions.
     */
    private splitStringsAndFunctions<T>(strAndClses: string[]|T[]): [string[], T[]] {
        return [
            (strAndClses as string[]).filter(str => typeof str === "string"),
            (strAndClses as T[]).filter(cls => typeof cls !== "string"),
        ];
    }

    /**
     * Creates a new driver based on the given driver type and options.
     */
    private createDriver(options: DriverOptions, logger: Logger): Driver {
        switch (options.type) {
            case "mysql":
                return new MysqlDriver(options, logger);
            case "postgres":
                return new PostgresDriver(options, logger);
            case "mariadb":
                return new MysqlDriver(options, logger);
            case "sqlite":
                return new SqliteDriver(options, logger);
            case "oracle":
                return new OracleDriver(options, logger);
            case "mssql":
                return new SqlServerDriver(options, logger);
            default:
                throw new MissingDriverError(options.type);
        }
    }

    /**
     * Creates a new connection and registers it in the connection manager.
     */
    private createConnection(name: string, driver: Driver, logger: Logger) {
        const existConnection = this.connections.find(connection => connection.name === name);
        if (existConnection) {
            if (existConnection.isConnected)
                throw new AlreadyHasActiveConnectionError(name);

            this.connections.splice(this.connections.indexOf(existConnection), 1);
        }

        const connection = new Connection(name, driver, logger);
        this.connections.push(connection);
        return connection;
    }

}
