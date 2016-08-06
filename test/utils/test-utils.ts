import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {createConnection} from "../../src/index";
import {Connection} from "../../src/connection/Connection";
import {DriverOptions} from "../../src/driver/DriverOptions";
import {EntitySchema} from "../../src/metadata/entity-schema/EntitySchema";

export interface TestingConnectionOptions {
    entities?: Function[];
    entitySchemas?: EntitySchema[];
    entityDirectories?: string[];
    secondaryConnections?: boolean;
}

export function closeConnections(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.close()));
}

export function createTestingConnectionOptions(type: "mysql"|"mysqlSecondary"|"postgres"|"postgresSecondary"): DriverOptions {
    const parameters = require(__dirname + "/../../../../config/parameters.json"); // path is relative to compile directory
    // const parameters = require(__dirname + "/../../config/parameters.json");

    const driverType: "mysql"|"postgres" = type === "mysql" || type === "mysqlSecondary" ? "mysql" : "postgres";
    return {
        type: driverType,
        host: parameters.connections[type].host,
        port: parameters.connections[type].port,
        username: parameters.connections[type].username,
        password: parameters.connections[type].password,
        database: parameters.connections[type].database,
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        }
    };
}

export async function setupTestingConnections(options?: TestingConnectionOptions): Promise<Connection[]> {
    
    const mysqlParameters: ConnectionOptions = {
        connectionName: "mysqlPrimaryConnection",
        driver: createTestingConnectionOptions("mysql"),
        autoSchemaCreate: true,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };
    
    const mysqlSecondaryParameters: ConnectionOptions = {
        connectionName: "mysqlSecondaryConnection",
        driver: createTestingConnectionOptions("mysqlSecondary"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const postgresParameters: ConnectionOptions = {
        connectionName: "postgresPrimaryConnection",
        driver: createTestingConnectionOptions("postgres"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const postgresSecondaryParameters: ConnectionOptions = {
        connectionName: "postgresSecondaryConnection",
        driver: createTestingConnectionOptions("postgresSecondary"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const mysql = true;
    const postgres = false;

    const allParameters: ConnectionOptions[] = [];
    if (mysql)
        allParameters.push(mysqlParameters);
    if (postgres)
        allParameters.push(postgresParameters);
    if (mysql && options && options.secondaryConnections)
        allParameters.push(mysqlSecondaryParameters);
    if (postgres && options && options.secondaryConnections)
        allParameters.push(postgresSecondaryParameters);
    
    return Promise.all(allParameters.map(parameters => createConnection(parameters)));
}

/**
 * @deprecated
 */
export function setupConnection(callback: (connection: Connection) => any, entities: Function[]) {

    const parameters: ConnectionOptions = {
        driver: {
            type: "mysql",
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test"
        },
        autoSchemaCreate: true,
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