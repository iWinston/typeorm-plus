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
export interface CreateConnectionParameters {

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
export function createConnection(parameters: CreateConnectionParameters): Promise<Connection> {

    let connection: Connection;
    switch (parameters.driver) {
        case "mysql":
            connection = connectionManager.createConnection(parameters.connectionName, new MysqlDriver(mysql));
            break;
        default:
            throw new Error(`Wrong driver ${parameters.driver} given. Supported drivers are: "mysql"`);
    }

    if (parameters.entityDirectories && parameters.entityDirectories.length > 0)
        connectionManager.importEntitiesFromDirectories(parameters.connectionName, parameters.entityDirectories);

    if (parameters.entities)
        connectionManager.importEntities(parameters.connectionName, parameters.entities);

    if (parameters.subscriberDirectories && parameters.subscriberDirectories.length > 0)
        connectionManager.importSubscribersFromDirectories(parameters.connectionName, parameters.subscriberDirectories);

    if (parameters.subscribers)
        connectionManager.importSubscribers(parameters.subscribers);

    return connection
        .connect(parameters.connectionOptions)
        .then(() => connection);
}