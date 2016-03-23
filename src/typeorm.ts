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

export interface CreateConnectionParameters {
    driver: "mysql";
    connectionName?: string;
    connectionOptions?: ConnectionOptions;
    entities?: Function[];
    subscribers?: Function[];
    entityDirectories?: string[];
    subscriberDirectories?: string[];
}

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

    if (parameters.entities) {
        connectionManager.importEntities(parameters.connectionName, parameters.entities);
    }

    if (parameters.subscriberDirectories && parameters.subscriberDirectories.length > 0)
        connectionManager.importSubscribersFromDirectories(parameters.connectionName, parameters.subscriberDirectories);

    // if (parameters.subscribers)
    //     connectionManager.importSubscribers(parameters.subscribers);

    return connection
        .connect(parameters.connectionOptions)
        .then(() => connection);
}


/**
 * Creates a new connection to mysql. Imports documents and subscribers from the given directories.
 * @deprecated
 */
export function createMysqlConnection(options: string, documentDirectories: string[]|Function[], subscriberDirectories?: string[]): Promise<Connection>;
export function createMysqlConnection(options: ConnectionOptions, documentDirectories: string[]|Function[], subscriberDirectories?: string[]): Promise<Connection>;
export function createMysqlConnection(configuration: string|ConnectionOptions, documentDirectories: string[]|Function[], subscriberDirectories?: string[]): Promise<Connection> {
    if (typeof configuration === "string") {
        configuration = { url: <string> configuration };
    }

    connectionManager.createConnection(new MysqlDriver(mysql));

    if (documentDirectories && documentDirectories.length > 0) {
        if (typeof documentDirectories[0] === "string") {
            connectionManager.importEntitiesFromDirectories(<string[]> documentDirectories);
        } else {
            connectionManager.importEntities(<Function[]> documentDirectories);
        }
    }

    if (subscriberDirectories && subscriberDirectories.length > 0)
        connectionManager.importSubscribersFromDirectories(subscriberDirectories);

    const connection = connectionManager.getConnection();
    return connection.connect(<ConnectionOptions> configuration).then(() => connection);
}
