import {Connection} from "../connection/Connection";
import {createConnection} from "../index";
import {MigrationExecutor} from "../migration/MigrationExecutor";

/**
 * Reverts last migration command.
 */
export class MigrationRevertCommand {

    command = "migration:revert";
    describe = "Reverts last executed migration.";

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
            await connection.undoLastMigration();

        } catch (err) {
            console.error(err);
            throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }

}