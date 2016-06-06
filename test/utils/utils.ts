import {CreateConnectionOptions} from "../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../src/index";
import {Connection} from "../../src/connection/Connection";

export interface TestingConnectionOptions {
    entities?: Function[];
    entityDirectories?: string[];
    secondaryConnections?: boolean;
}

export function closeConnections(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.close()));
}

export async function setupTestingConnections(options?: TestingConnectionOptions): Promise<Connection[]> {
    // const parameters = require(__dirname + "/../../../../config/parameters.json"); // path is relative to compile directory
    const parameters = require(__dirname + "/../../config/parameters.json"); // path is relative to compile directory
    
    const mysqlParameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: parameters.connections.mysql.host,
            port: parameters.connections.mysql.port,
            username: parameters.connections.mysql.username,
            password: parameters.connections.mysql.password,
            database: parameters.connections.mysql.database,
            autoSchemaCreate: true,
            logging: {
                logFailedQueryError: true
            }
        },
        entities: options && options.entities ? options.entities : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const mysqlSecondaryParameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: parameters.connections.mysqlSecondary.host,
            port: parameters.connections.mysqlSecondary.port,
            username: parameters.connections.mysqlSecondary.username,
            password: parameters.connections.mysqlSecondary.password,
            database: parameters.connections.mysqlSecondary.database,
            autoSchemaCreate: true,
            logging: {
                logFailedQueryError: true
            }
        },
        entities: options && options.entities ? options.entities : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const postgresParameters: CreateConnectionOptions = {
        driver: "postgres",
        connection: {
            host: parameters.connections.postgres.host,
            port: parameters.connections.postgres.port,
            username: parameters.connections.postgres.username,
            password: parameters.connections.postgres.password,
            database: parameters.connections.postgres.database,
            autoSchemaCreate: true,
            logging: {
                logFailedQueryError: true
            }
        },
        entities: options && options.entities ? options.entities : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const postgresSecondaryParameters: CreateConnectionOptions = {
        driver: "postgres",
        connection: {
            host: parameters.connections.postgresSecondary.host,
            port: parameters.connections.postgresSecondary.port,
            username: parameters.connections.postgresSecondary.username,
            password: parameters.connections.postgresSecondary.password,
            database: parameters.connections.postgresSecondary.database,
            autoSchemaCreate: true,
            logging: {
                logFailedQueryError: true
            }
        },
        entities: options && options.entities ? options.entities : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const allParameters: CreateConnectionOptions[] = [mysqlParameters, /*, postgresParameters*/];
    if (options && options.secondaryConnections)
        allParameters.push(mysqlSecondaryParameters/*, postgresSecondaryParameters*/);
    
    return Promise.all(allParameters.map(parameters => createConnection(parameters)));
}

/**
 * @deprecated
 */
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
        return createConnection(parameters)
            .then(connection => {
                if (callback)
                    callback(connection);
                return connection;
            })
            .catch(e => console.log("Error during connection to db: " + e));
    };
}

export function reloadDatabases(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.syncSchema(true)));
}

/**
 */
export function reloadDatabase(connection: Connection) {
    return function () {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    };
}