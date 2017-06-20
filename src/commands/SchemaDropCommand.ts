import {createConnections, createConnection} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";

/**
 * Drops all tables of the database from the given connection.
 */
export class SchemaDropCommand {
    command = "schema:drop";
    describe = "Drops all tables in the database. It drops tables on all connections you have. " +
        "To drop table of a concrete connection's database use -c option.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to drop all tables."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined, connections: Connection[] = [];
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;

            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            if (argv.connection) {
                const connectionOptions = await connectionOptionsReader.get(argv.connection);
                connection = await createConnection(connectionOptions);
                await connection.dropDatabase();

            } else {
                const connectionOptions = await connectionOptionsReader.all();
                connections = await createConnections(connectionOptions);
                await Promise.all(connections.map(connection => connection.dropDatabase()));
            }

        } catch (err) {
            console.error(err);
            // throw err;

        } finally {
            if (connection)
                await connection.close();

            await Promise.all(connections.map(connection => connection.close()));
        }
    }
}