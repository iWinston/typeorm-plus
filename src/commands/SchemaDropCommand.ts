import {createConnections, createConnection} from "../index";

/**
 * Drops all tables of the database from the given connection.
 */
export class SchemaDropCommand {
    command = "schema:drop";
    describe = "Drops all tables in the database. It drops tables on all connections you have. " +
        "To drop table of a concrete connection's database use -c option.";

    builder(yargs: any) {
        return yargs.option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which to drop all tables"
        });
    }

    async handler(argv: any) {
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;
            if (argv.connection) {
                const connection = await createConnection(argv.connection);
                await connection.dropDatabase();
                await connection.close();
            } else {
                const connections = await createConnections();
                await Promise.all(connections.map(connection => connection.dropDatabase()));
                await Promise.all(connections.map(connection => connection.close()));
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}