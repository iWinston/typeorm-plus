import {createConnections, createConnection} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";

/**
 * Synchronizes database schema with entities.
 */
export class SchemaSyncCommand {
    command = "schema:sync";
    describe = "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
        "To run update queries on a concrete connection use -c option.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which schema synchronization needs to to run."
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
                connection = await createConnection(connectionOptions); // process.cwd()
                await connection.syncSchema(false);

            } else {
                const connectionOptions = await connectionOptionsReader.all();
                connections = await createConnections(connectionOptions);
                await Promise.all(connections.map(connection => connection.syncSchema(false)));
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