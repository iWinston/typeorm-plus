import {CreateConnectionOptions} from "../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../src/index";
import {Connection} from "../../src/connection/Connection";

export function setupConnection(callback: (connection: Connection) => any, entities: Function[]) {

    const parameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test",
            autoSchemaCreate: true
        },
        entities: entities
    };

    return function() {
        console.log("creating connection");
        return createConnection(parameters)
            .then(connection => {
                console.log("connection");
                if (callback)
                    callback(connection);
                return connection;
            })
            .catch(e => console.log("Error during connection to db: " + e));
    };
}

export function reloadDatabase(connection: Connection) {
    return function () {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    };
}