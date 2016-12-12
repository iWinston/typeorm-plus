import {createConnection} from "../index";

/**
 * Reverts last migration command.
 */
export class MigrationRevertCommand {

    command = "migrations:revert";
    describe = "Reverts last executed migration.";

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
        process.env.SKIP_SCHEMA_CREATION = true;
        const connection = await createConnection(argv.connection, process.cwd() + "/" + argv.config);

        try {
            await connection.undoLastMigration();

        } catch (err) {
            connection.logger.log("error", err);
            throw err;

        } finally {
            await connection.close();
        }
    }

}