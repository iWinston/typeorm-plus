import {createConnection} from "../index";
import {Connection} from "../connection/Connection";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";

/**
 * Shows sql to be executed by schema:sync command.
 */
export class SchemaSyncLogCommand {
    command = "schema:sync";
    describe = "Shows sql to be executed by schema:sync command. It shows schema:sync log only for your default connection. " +
        "To run update queries on a concrete connection use -c option.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection of which schema sync log should be shown."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined;
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;

            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            connection = await createConnection(connectionOptions);
            const sqls = await connection.logSyncSchema();
            sqls.forEach(sql => {
                if (typeof sql === "string") {
                    console.log(sql);
                } else {
                    console.log(sql.up);
                }
            });

        } catch (err) {
            console.error(err);
            // throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }
}