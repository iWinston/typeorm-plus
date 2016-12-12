import {createConnection} from "../index";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Executes an sql query on the given connection.
 */
export class QueryCommand {
    command = "query";
    describe = "Executes given SQL query on a default connection. Specify connection name to run query on a specific connection.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query."
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
        let queryRunner: QueryRunner|undefined = undefined;
        try {
            queryRunner = await connection.driver.createQueryRunner();
            const queryResult = await queryRunner.query(argv._[1]);
            connection.logger.log("info", "Query executed. Result: " + JSON.stringify(queryResult));

        } catch (err) {
            connection.logger.log("error", err);
            throw err;

        } finally {
            if (queryRunner)
                await queryRunner.release();

            await connection.close();
        }
    }
}