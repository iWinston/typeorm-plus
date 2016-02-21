import {ConnectionOptions} from "./connection/ConnectionOptions";
import {ConnectionManager} from "./connection/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MysqlDriver} from "./driver/MysqlDriver";
//import * as mysql from "mysql";
let mysql = require("mysql");

/**
 * Provides quick functions for easy-way of performing some commonly making operations.
 */
export class TypeORM {

    /**
     * Global connection manager.
     */
    static connectionManager = new ConnectionManager();

    /**
     * Creates a new connection to mongodb. Imports documents and subscribers from the given directories.
     */
    static createMysqlConnection(options: string, documentDirectories: string[]|Function[], subscriberDirectories?: string[]): Promise<Connection>;
    static createMysqlConnection(options: ConnectionOptions, documentDirectories: string[]|Function[], subscriberDirectories?: string[]): Promise<Connection>;
    static createMysqlConnection(configuration: string|ConnectionOptions, documentDirectories: string[]|Function[], subscriberDirectories?: string[]): Promise<Connection> {
        if (typeof configuration === "string") {
            configuration = { url: <string> configuration };
        }

        this.connectionManager.addConnection(new MysqlDriver(mysql));

        if (documentDirectories && documentDirectories.length > 0) {
            if (typeof documentDirectories[0] === "string") {
                this.connectionManager.importEntitiesFromDirectories(<string[]> documentDirectories);
            } else {
                this.connectionManager.importEntities(<Function[]> documentDirectories);
            }
        }

        if (subscriberDirectories && subscriberDirectories.length > 0)
            this.connectionManager.importSubscribersFromDirectories(subscriberDirectories);

        const connection = this.connectionManager.getConnection();
        return connection.connect(<ConnectionOptions> configuration).then(() => connection);
    }

}
