import * as fs from "fs";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";
import {createConnection} from "../index";
import {TableSchema} from "../schema-builder/schema/TableSchema";
import {ColumnSchema} from "../schema-builder/schema/ColumnSchema";

/**
 * Runs migration command.
 */
export class MigrationRunCommand {

    command = "migration:run";
    describe = "Runs migration to a latest (or given) version.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query"
            });
            // .option("v", {
            //     alias: "version",
            //     describe: "Version to migrate to"
            // });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined,
            queryRunner: QueryRunner|undefined = undefined;
        try {
            process.env.SKIP_SCHEMA_CREATION = true;
            connection = await createConnection("default" || argv.connection);
            queryRunner = await connection.driver.createQueryRunner();

            // todo
            const tableExist = await queryRunner.hasTable("migrations");
            if (!tableExist) {
                await queryRunner.createTable(new TableSchema("migrations", [
                    new ColumnSchema()
                ]));
            }

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
        // const fileContents = this.getTemplate(argv.name);
        // const directory = argv.dir || "./migrations";
        // const filename = new Date().getTime() + "-" + argv.name;
        // this.createFile(directory + "/" + filename, fileContents);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createFile(path: string, contents: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            fs.writeFile(path, contents, err => err ? fail(err) : ok());
        });
    }

    protected getTemplate(name: string) {
        return `import {MigrationInterface} from "typeorm";

export class ${name} implements MigrationInterface {

    up(queryRunner: QueryRunner, connection: Connection): Promise<any>|any {
    }

    down(queryRunner: QueryRunner, connection: Connection): Promise<any>|any {
    }

}
`;
    }

}