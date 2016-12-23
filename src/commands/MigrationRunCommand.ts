import {createConnection} from "../index";

/**
 * Runs migration command.
 */
export class MigrationRunCommand {

    command = "migrations:run";
    describe = "Runs all pending migrations.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig.json",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        try {
            process.env.SKIP_SCHEMA_CREATION = true;
            process.env.SKIP_SUBSCRIBERS_LOADING = true;
            const connection = await createConnection(argv.connection, process.cwd() + "/" + argv.config);
            try {
                await connection.runMigrations();

            } catch (err) {
                connection.logger.log("error", err);

            } finally {
                await connection.close();
            }

        } catch (err) {
            console.error(err);
            throw err;
        }
    }

}