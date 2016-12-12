import * as fs from "fs";
import {ConnectionOptions} from "../connection/ConnectionOptions";

/**
 * Creates a new migration file.
 */
export class MigrationCreateCommand {

    command = "migrations:create";
    describe = "Creates a new migration file.";

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
                default: "ormconfig.json",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {
        const timestamp = new Date().getTime();
        const fileContent = MigrationCreateCommand.getTemplate(argv.name, timestamp);
        const filename = timestamp + "-" + argv.name + ".ts";
        let directory = argv.dir;

        // if directory is not set then try to open tsconfig and find default path there
        if (!directory) {
            try {
                const connections: ConnectionOptions[] = require(process.cwd() + "/" + argv.config);
                if (connections) {
                    const connection = connections.find(connection => { // todo: need to implement "environment" support in the ormconfig too
                        return connection.name === argv.connection || ((argv.connection === "default" || !argv.connection) && !connection.name);
                    });
                    if (connection && connection.cli) {
                        directory = connection.cli.migrationsDir;
                    }
                }
            } catch (err) { }
        }

        await MigrationCreateCommand.createFile(process.cwd() + "/" + (directory ? (directory + "/") : "") + filename, fileContent);
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a file with the given content in the given path.
     */
    protected static createFile(path: string, content: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            fs.writeFile(path, content, err => err ? fail(err) : ok());
        });
    }

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number): string {
        return `import {MigrationInterface, QueryRunner, Connection} from "typeorm";

export class ${name}${timestamp} implements MigrationInterface {

    async up(queryRunner: QueryRunner, connection: Connection): Promise<any> {
    }

    async down(queryRunner: QueryRunner, connection: Connection): Promise<any> {
    }

}
`;
    }

}