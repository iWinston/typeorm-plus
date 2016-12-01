import {createConnections, createConnection} from "../index";
import {Connection} from "../connection/Connection";

/**
 * Synchronizes database schema with entities.
 */
export class SchemaSyncCommand {
    command = "schema:sync";
    describe = "Synchronizes your entities with database schema. It runs schema update queries on all connections you have. " +
        "To run update queries on a concrete connection use -c option.";

    builder(yargs: any) {
        return yargs.option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which schema synchronization needs to to run"
        });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined, connections: Connection[] = [];
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;
            if (argv.connection) {
                connection = await createConnection(argv.connection);
                await connection.syncSchema(false);
                await connection.close();
            } else {
                connections = await createConnections();
                await Promise.all(connections.map(connection => connection.syncSchema(false)));
            }

        } catch (err) {
            console.error(err);
            throw err;

        } finally {
            if (connection)
                await connection.close();

            await Promise.all(connections.map(connection => connection.close()));
        }
    }
}