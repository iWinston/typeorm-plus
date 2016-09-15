import {createConnectionFromConfig} from "../index";

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
        try {
            process.env.SKIP_SCHEMA_CREATION = true;
            const connectionName = "default" || argv.connection;
            const connection = await createConnectionFromConfig(connectionName);
            const queryRunner = await connection.driver.createQueryRunner();
            const queryResult = await queryRunner.query(argv._[1]);
            console.log("Query executed. Result: ", queryResult);
            await queryRunner.release();
            await connection.close();
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}