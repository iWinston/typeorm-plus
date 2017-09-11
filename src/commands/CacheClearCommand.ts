import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
const chalk = require("chalk");

/**
 * Clear cache command.
 */
export class CacheClearCommand {

    command = "cache:clear";
    describe = "Clears all data stored in query runner cache.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
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
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            Object.assign(connectionOptions, {
                subscribers: [],
                dropSchemaOnConnection: false,
                autoSchemaSync: false,
                autoMigrationsRun: false,
                logging: { logQueries: false, logFailedQueryError: false, logSchemaCreation: true }
            });
            connection = await createConnection(connectionOptions);

            if (!connection.queryResultCache)
                return console.log(chalk.black.bgRed("Cache is not enabled. To use cache enable it in connection configuration."));

            await connection.queryResultCache.clear();
            console.log(chalk.green("Cache was successfully cleared"));

        } catch (err) {
            console.log(chalk.black.bgRed("Error during cache clear:"));
            console.error(err);
            // throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }

}