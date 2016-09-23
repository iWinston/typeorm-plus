import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {createConnection} from "../../src/index";
import {Connection} from "../../src/connection/Connection";
import {DriverOptions} from "../../src/driver/DriverOptions";
import {EntitySchema} from "../../src/entity-schema/EntitySchema";

export interface TestingConnectionOptions {
    entitySchemas?: EntitySchema[];
    entities?: string[]|Function[];
    secondaryConnections?: boolean;
    schemaCreate?: boolean;
    dropSchemaOnConnection?: boolean;
    reloadAndCreateSchema?: boolean;
    skipMysql?: boolean;
    skipMariadb?: boolean;
    skipPostgres?: boolean;
    skipSqlite?: boolean;
    skipSqlserver?: boolean;
    skipOracle?: boolean;
    skipSqlServer?: boolean;
}

export function closeConnections(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.isConnected ? connection.close() : undefined));
}

export function createTestingConnectionOptions(type: "mysql"|"mysqlSecondary"|"mariadb"|"mariadbSecondary"|"postgres"|"postgresSecondary"|"sqlite"|"sqliteSecondary"|"mssql"|"mssqlSecondary"): DriverOptions {
    const parameters = require(__dirname + "/../../../../config/parameters.json"); // path is relative to compile directory
    // const parameters = require(__dirname + "/../../config/parameters.json");

    let driverType: "mysql"|"mariadb"|"postgres"|"sqlite"|"mssql" = "mysql"; // = type === "mysql" || type === "mysqlSecondary" ? "mysql" : "postgres";
    if (type === "mysql" || type === "mysqlSecondary") {
        driverType = "mysql";
    } else if (type === "mariadb" || type === "mariadbSecondary") {
        driverType = "mariadb";
    } else if (type === "postgres" || type === "postgresSecondary") {
        driverType = "postgres";
    } else if (type === "sqlite" || type === "sqliteSecondary") {
        driverType = "sqlite";
    } else if (type === "mssql" || type === "mssqlSecondary") {
        driverType = "mssql";
    }

    return {
        type: driverType,
        host: parameters.connections[type].host,
        port: parameters.connections[type].port,
        username: parameters.connections[type].username,
        password: parameters.connections[type].password,
        database: parameters.connections[type].database,
        storage: parameters.connections[type].storage
    };
}

/*export async function setupTestingConnections(options?: TestingConnectionOptions) {
    const parameters: ConnectionOptions = {
        driver: createTestingConnectionOptions(process.env["connection_setup_name"]),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entities: options && options.entities ? options.entities : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const connection = await createConnection(parameters);
    if (options && options.reloadAndCreateSchema)
        await connection.syncSchema(true);

    return [connection];
}*/

export async function setupTestingConnections(options?: TestingConnectionOptions): Promise<Connection[]> {
    
    const mysqlParameters: ConnectionOptions = {
        name: "mysqlPrimaryConnection",
        driver: createTestingConnectionOptions("mysql"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };
    
    const mysqlSecondaryParameters: ConnectionOptions = {
        name: "mysqlSecondaryConnection",
        driver: createTestingConnectionOptions("mysqlSecondary"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const mariadbParameters: ConnectionOptions = {
        name: "mariadbPrimaryConnection",
        driver: createTestingConnectionOptions("mariadb"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const mariadbSecondaryParameters: ConnectionOptions = {
        name: "mariadbSecondaryConnection",
        driver: createTestingConnectionOptions("mariadbSecondary"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const postgresParameters: ConnectionOptions = {
        name: "postgresPrimaryConnection",
        driver: createTestingConnectionOptions("postgres"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const postgresSecondaryParameters: ConnectionOptions = {
        name: "postgresSecondaryConnection",
        driver: createTestingConnectionOptions("postgresSecondary"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const sqliteParameters: ConnectionOptions = {
        name: "sqlitePrimaryConnection",
        driver: createTestingConnectionOptions("sqlite"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const sqliteSecondaryParameters: ConnectionOptions = {
        name: "sqliteSecondaryConnection",
        driver: createTestingConnectionOptions("sqliteSecondary"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const mssqlParameters: ConnectionOptions = {
        name: "mssqlPrimaryConnection",
        driver: createTestingConnectionOptions("mssql"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const mssqlSecondaryParameters: ConnectionOptions = {
        name: "mssqlSecondaryConnection",
        driver: createTestingConnectionOptions("mssqlSecondary"),
        autoSchemaSync: options && options.entities ? options.schemaCreate : false,
        dropSchemaOnConnection: options && options.entities ? options.dropSchemaOnConnection : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const mysql = true; // !options || !options.skipMysql;
    const mariadb = true; // !options || !options.skipMariadb;
    const postgres = true; // !options || !options.skipPostgres;
    const sqlite = true; // !options || !options.skipSqlite;
    const mssql = false; // !options || !options.skipSqlserver;

    const allParameters: ConnectionOptions[] = [];
    if (mysql)
        allParameters.push(mysqlParameters);
    if (mariadb)
        allParameters.push(mariadbParameters);
    if (postgres)
        allParameters.push(postgresParameters);
    if (sqlite)
        allParameters.push(sqliteParameters);
    if (mssql)
        allParameters.push(mssqlParameters);
    if (mysql && options && options.secondaryConnections)
        allParameters.push(mysqlSecondaryParameters);
    if (mariadb && options && options.secondaryConnections)
        allParameters.push(mariadbSecondaryParameters);
    if (postgres && options && options.secondaryConnections)
        allParameters.push(postgresSecondaryParameters);
    if (sqlite && options && options.secondaryConnections)
        allParameters.push(sqliteSecondaryParameters);
    if (mssql && options && options.secondaryConnections)
        allParameters.push(mssqlSecondaryParameters);

    return Promise.all(allParameters.map(async parameters => {
        const connection = await createConnection(parameters);
        if (options && options.reloadAndCreateSchema)
            await connection.syncSchema(true);

        return connection;
    }));
}

/**
 * @deprecated
 */
export function setupConnection(callback: (connection: Connection) => any, entities: Function[]) {

    const parameters: ConnectionOptions = {
        driver: {
            type: "mysql",
            host: "localhost",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test"
        },
        autoSchemaSync: true,
        entities: entities
    };

    return function() {
        return createConnection(parameters)
            .then(connection => {
                if (callback)
                    callback(connection);
                return connection;
            })
            .catch(e => {
                console.log("Error during connection to db: " + e);
                throw e;
            });
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