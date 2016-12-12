import {Connection} from "../connection/Connection";
import {createConnection} from "../index";
import {MigrationExecutor} from "../migration/MigrationExecutor";

/**
 * Runs migration command.
 */
export class MigrationRunCommand {

    command = "migration:run";
    describe = "Runs all pending migrations.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query"
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined;
        try {
            process.env.SKIP_SCHEMA_CREATION = true;
            connection = await createConnection("default" || argv.connection);
            await connection.runMigrations();

        } catch (err) {
            console.error(err);
            throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }

}