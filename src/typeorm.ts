/*!
 
 */

import {ConnectionOptions} from "./connection/ConnectionOptions";
import {ConnectionManager} from "./connection/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MysqlDriver} from "./driver/MysqlDriver";

const connectionManager = new ConnectionManager();

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
    connection: ConnectionOptions;

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
            connection = connectionManager.createConnection(options.connectionName, new MysqlDriver(), options.connection);
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

    return connection.connect().then(() => connection);
}

/**
 * Default export. Global connection manager.
 */
export default connectionManager;

// export everything commonly used
export {Connection} from "./connection/Connection";
export {ConnectionManager} from "./connection/ConnectionManager";
export {ConnectionOptions} from "./connection/ConnectionOptions";
export {Driver} from "./driver/Driver";
export {MysqlDriver} from "./driver/MysqlDriver";
export {QueryBuilder} from "./query-builder/QueryBuilder";
export {EntityManager} from "./repository/EntityManager";
export {Repository} from "./repository/Repository";
export {FindOptions} from "./repository/FindOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EventSubscriberInterface} from "./subscriber/EventSubscriberInterface";