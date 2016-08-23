import {Connection} from "./Connection";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {MysqlDriver} from "../driver/MysqlDriver";
import {ConnectionOptions} from "./ConnectionOptions";
import {DriverOptions} from "../driver/DriverOptions";
import {Driver} from "../driver/Driver";
import {MissingDriverError} from "./error/MissingDriverError";
import {PostgresDriver} from "../driver/PostgresDriver";
import {AlreadyHasActiveConnectionError} from "./error/AlreadyHasActiveConnectionError";

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
     * Creates a new connection based on the given connection options and registers a new connection in the manager.
     */
    async createAndConnect(options: ConnectionOptions): Promise<Connection> {
        const connection = this.create(options);

        // connect to the database
        await connection.connect();

        // if option is set - drop schema once connection is done
        if (options.dropSchemaOnConnection)
            await connection.dropDatabase();

        // if option is set - automatically synchronize a schema
        if (options.autoSchemaCreate)
            await connection.syncSchema();

        return connection;
    }

    /**
     * Creates a new connection based on the given connection options and registers this connection in the manager.
     * Note that dropSchemaOnConnection and autoSchemaCreate options of a ConnectionOptions are not working there - use
     * createAndConnect method to use them.
     */
    create(options: ConnectionOptions): Connection {
        const driver = this.createDriver(options.driver);
        const connection = this.createConnection(options.name || "default", driver);

        if (options.entitySchemaDirectories && options.entitySchemaDirectories.length > 0)
            connection.importEntitySchemaFromDirectories(options.entitySchemaDirectories);

        if (options.entitySchemas)
            connection.importEntitySchemas(options.entitySchemas);

        if (options.entityDirectories && options.entityDirectories.length > 0)
            connection.importEntitiesFromDirectories(options.entityDirectories);

        if (options.entities)
            connection.importEntities(options.entities);

        if (options.subscriberDirectories && options.subscriberDirectories.length > 0)
            connection.importSubscribersFromDirectories(options.subscriberDirectories);

        if (options.subscribers)
            connection.importSubscribers(options.subscribers);

        if (options.namingStrategyDirectories && options.namingStrategyDirectories.length > 0)
            connection.importNamingStrategiesFromDirectories(options.namingStrategyDirectories);

        if (options.namingStrategies)
            connection.importNamingStrategies(options.namingStrategies);
        
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
     * Creates a new driver based on the given driver type and options.
     */
    private createDriver(options: DriverOptions): Driver {
        switch (options.type) {
            case "mysql":
                return new MysqlDriver(options);
            case "postgres":
                return new PostgresDriver(options);
            default:
                throw new MissingDriverError(options.type);
        }
    }

    /**
     * Creates a new connection and registers it in the connection manager.
     */
    private createConnection(name: string, driver: Driver) {
        const existConnection = this.connections.find(connection => connection.name === name);
        if (existConnection) {
            if (existConnection.isConnected)
                throw new AlreadyHasActiveConnectionError(name);

            this.connections.splice(this.connections.indexOf(existConnection), 1);
        }

        const connection = new Connection(name, driver);
        this.connections.push(connection);
        return connection;
    }

}
