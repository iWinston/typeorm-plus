import {tuple} from "../util/TypeUtils";
import {MysqlConnectionOptions} from "../driver/mysql/MysqlConnectionOptions";
import {PostgresConnectionOptions} from "../driver/postgres/PostgresConnectionOptions";
import {SqliteConnectionOptions} from "../driver/sqlite/SqliteConnectionOptions";
import {SqlServerConnectionOptions} from "../driver/sqlserver/SqlServerConnectionOptions";
import {OracleConnectionOptions} from "../driver/oracle/OracleConnectionOptions";
import {WebSqlConnectionOptions} from "../driver/websql/WebSqlConnectionOptions";
import {MongoConnectionOptions} from "../driver/mongodb/MongoConnectionOptions";
import {CordovaConnectionOptions} from "../driver/cordova/CordovaConnectionOptions";
import {SqljsConnectionOptions} from "../driver/sqljs/SqljsConnectionOptions";

/**
 * ConnectionOptions is an interface with settings and options for specific connection.
 * Options contain database and other connection-related settings.
 * Consumer must provide connection options for each of your connections.
 */
export type ConnectionOptions =
    MysqlConnectionOptions|
    PostgresConnectionOptions|
    SqliteConnectionOptions|
    SqlServerConnectionOptions|
    OracleConnectionOptions|
    WebSqlConnectionOptions|
    CordovaConnectionOptions|
    SqljsConnectionOptions|
    MongoConnectionOptions;


/**
 * List of all available connection types. This list is guaranteed to be exhaustive and correct.
 */
export const ConnectionTypes = tuple("cordova", "mariadb", "mongodb", "mssql", "mysql", "oracle", "postgres", "sqlite", "sqljs", "websql");

/**
 * This function provides a compile-time verification that the ConnectionTypes tuple above is accurate.
 *
 * If a value is missing in ConnectionTypes or if there is an extraneous value, then this function will
 * not type check.
 *
 * This function should never be called or imported so it can pruned during tree shaking.
 */
export function __ensureConnectionTypesIsCorrect() {
    // Force the TS compiler to fetch the full enum type across all definitions
    const a: ConnectionOptions = { type: "mysql" } as any;
    type RealType = typeof a.type;

    // This line ensures all values in the enum are acceptable
    // If there is a compile error here, then there is an extra value in ConnectionTypes or a typo.
    const b: RealType = ConnectionTypes[0 as number];

    // This line ensures all possible values are listed in ConnectionTypes
    // If this line gives a compile error, something is missing in ConnectionTypes
    ConnectionTypes.indexOf(b);
}
