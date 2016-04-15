import {Connection} from "./Connection";
import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";

/**
 * Array for the connections.
 */
export class ConnectionArray extends Array<Connection> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new connection and pushes a connection to the array.
     */
    createAndPush(name: string, driver: Driver, options: ConnectionOptions) {
        this.removeByName(name);
        const connection = new Connection(name, <Driver> driver, options);
        this.push(connection);
        return connection;
    }

    /**
     * Gets connection with a given name.
     */
    getWithName(name: string) {
        return this.find(connection => connection.name === name);
    }

    /**
     * Checks if connection with a given name exist.
     */
    hasWithName(name: string) {
        return !!this.getWithName(name);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private removeByName(name: string) {
        const existConnection = this.find(connection => connection.name === name);
        if (existConnection)
            this.splice(this.indexOf(existConnection), 1);
    }

}