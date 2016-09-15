import {createConnectionFromConfig, createConnectionsFromConfig} from "../index";

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
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;
            if (argv.connection) {
                const connection = await createConnectionFromConfig(argv.connection);
                await connection.syncSchema(false);
                await connection.close();
            } else {
                const connections = await createConnectionsFromConfig();
                await Promise.all(connections.map(connection => connection.syncSchema(false)));
                await Promise.all(connections.map(connection => connection.close()));
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}