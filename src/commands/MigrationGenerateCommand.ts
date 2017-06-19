import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
import {Connection} from "../connection/Connection";
import {createConnection} from "../index";
const mkdirp = require("mkdirp");

/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export class MigrationGenerateCommand {

    command = "migrations:generate";
    describe = "Generates a new migration file with sql needs to be executed to update schema.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("n", {
                alias: "name",
                describe: "Name of the migration class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migration should be created."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {
        const timestamp = new Date().getTime();
        const filename = timestamp + "-" + argv.name + ".ts";
        let directory = argv.dir;

        // if directory is not set then try to open tsconfig and find default path there
        if (!directory) {
            try {
                const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
                const connectionOptions = await connectionOptionsReader.get(argv.connection);
                directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
            } catch (err) { }
        }

        let connection: Connection|undefined = undefined;
        try {
            process.env.LOGGER_CLI_SCHEMA_SYNC = true;
            process.env.SKIP_SCHEMA_CREATION = true;

            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            connection = await createConnection(connectionOptions);
            const sqls = await connection.logSyncSchema();
            const fileContent = MigrationGenerateCommand.getTemplate(argv.name, timestamp, sqls, connection);
            await CommandUtils.createFile(process.cwd() + "/" + (directory ? (directory + "/") : "") + filename, fileContent);

        } catch (err) {
            if (connection)
                (connection as Connection).logger.log("error", err);
            throw err;

        } finally {
            if (connection)
                await connection.close();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number, sqlQueries: string[], connection: Connection): string {
        return `import {Connection, EntityManager, MigrationInterface, QueryRunner} from "typeorm";

export class ${name}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner, connection: Connection, entityManager?: EntityManager): Promise<any> {
        ${sqlQueries.map(query => "queryRunner.query(`" + query.replace("`", "\\`") + `\`);
`)}
    }

    public async down(queryRunner: QueryRunner, connection: Connection, entityManager?: EntityManager): Promise<any> {
    }

}
`;
    }

}