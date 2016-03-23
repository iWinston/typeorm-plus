import {ConnectionOptions} from "./connection/ConnectionOptions";
import {ConnectionManager} from "./connection/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MysqlDriver} from "./driver/MysqlDriver";
// import * as mysql from "mysql";
let mysql = require("mysql");

/**
 * Global connection manager.
 */
export const connectionManager = new ConnectionManager();

/**
 * All options to help to create a new connection.
 */
export interface CreateConnectionOptions {

    /**
     * Driver type. Mysql is the only driver supported at this moment.
     */
    driver: "mysql";

    /**
     * Database connection options.
     */
    connectionOptions: ConnectionOptions;

    /**
     * Connection name. By default its called "default". Different connections must have different names.
     */
    connectionName?: string;

    /**
     * Entities to be loaded for the new connection.
     */
    entities?: Function[];

    /**
     * Subscribers to be loaded for the new connection.
     */
    subscribers?: Function[];

    /**
     * List of directories from where entities will be loaded.
     */
    entityDirectories?: string[];

    /**
     * List of directories from where subscribers will be loaded.
     */
    subscriberDirectories?: string[];
}

/**
 * Creates a new connection with the database.
 */
export function createConnection(options: CreateConnectionOptions): Promise<Connection> {

    let connection: Connection;
    switch (options.driver) {
        case "mysql":
            connection = connectionManager.createConnection(options.connectionName, new MysqlDriver(mysql));
            break;
        default:
            throw new Error(`Wrong driver ${options.driver} given. Supported drivers are: "mysql"`);
    }

    if (options.entityDirectories && options.entityDirectories.length > 0)
        connectionManager.importEntitiesFromDirectories(options.connectionName, options.entityDirectories);

    if (options.entities)
        connectionManager.importEntities(options.connectionName, options.entities);

    if (options.subscriberDirectories && options.subscriberDirectories.length > 0)
        connectionManager.importSubscribersFromDirectories(options.connectionName, options.subscriberDirectories);

    if (options.subscribers)
        connectionManager.importSubscribers(options.subscribers);

    return connection
        .connect(options.connectionOptions)
        .then(() => connection);
}