import {Connection} from "../connection/Connection";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {MysqlDriver} from "../driver/MysqlDriver";
import {CreateConnectionOptions} from "./CreateConnectionOptions";
import {ConnectionOptions} from "../connection/ConnectionOptions";
import {Driver} from "../driver/Driver";
import {MissingDriverError} from "./error/MissingDriverError";

/**
 * Connection manager holds all connections made to the databases and providers helper management functions 
 * for all exist connections.
 */
export class ConnectionManager {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connections: Connection[] = [];
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new connection based on the given connection options and registers a new connection in the manager.
     */
    create(options: CreateConnectionOptions): Promise<Connection> {
        const driver = this.createDriver(options.driver);
        const connection = this.createConnection(options.connectionName || "default", driver, options.connection);

        if (options.entitySchemaDirectories && options.entitySchemaDirectories.length > 0)
            connection.importEntitySchemaFromDirectories(options.entitySchemaDirectories);

        if (options.entitySchemas)
            connection.importSchemas(options.entitySchemas);

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

        return connection.connect();
    }

    /**
     * Gets registered connection with the given name. If connection name is not given then it will get a default
     * connection.
     */
    get(name: string = "default"): Connection {
        if (!name) name = "default";
        
        const connection = this.connections.find(connection => connection.name === name);
        if (!connection)
            throw new ConnectionNotFoundError(name);

        return connection;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createDriver(driverName: string) {
        switch (driverName) {
            case "mysql":
                return new MysqlDriver();
            default:
                throw new MissingDriverError(driverName);
        }
    }

    /**
     * Creates a new connection and pushes a connection to the array.
     */
    createConnection(name: string, driver: Driver, options: ConnectionOptions) {
        const existConnection = this.connections.find(connection => connection.name === name);
        if (existConnection)
            this.connections.splice(this.connections.indexOf(existConnection), 1);
        
        const connection = new Connection(name, driver, options);
        this.connections.push(connection);
        return connection;
    }

}
