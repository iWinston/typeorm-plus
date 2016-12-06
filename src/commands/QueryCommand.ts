import {createConnection} from "../index";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";

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
                describe: "Name of the connection on which to run a query"
            });
    }

    async handler(argv: any) {
        let connection: Connection|undefined = undefined,
            queryRunner: QueryRunner|undefined = undefined;
        try {
            process.env.SKIP_SCHEMA_CREATION = true;
            connection = await createConnection("default" || argv.connection);
            queryRunner = await connection.driver.createQueryRunner();
            const queryResult = await queryRunner.query(argv._[1]);
            console.log("Query executed. Result: ", queryResult);

        } catch (err) {
            console.error(err);
            throw err;

        } finally {
            if (queryRunner)
                await queryRunner.release();
            if (connection)
                await connection.close();
        }
    }
}