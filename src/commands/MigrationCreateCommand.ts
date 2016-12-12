import * as fs from "fs";

/**
 * Creates a new migration file.
 */
export class MigrationCreateCommand {

    command = "migrations:create";
    describe = "Creates a new migration file.";

    builder(yargs: any) {
        return yargs
            // .option("c", {
            //     alias: "connection",
            //     default: "default",
            //     describe: "Name of the connection on which run a query."
            // })
            .option("n", {
                alias: "name",
                describe: "Name of the migration class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migration should be created.",
                demand: true
            });
    }

    async handler(argv: any) {
        const timestamp     = new Date().getTime();
        const fileContent   = MigrationCreateCommand.getTemplate(argv.name, timestamp);
        const directory     = argv.dir; // || "./migrations";
        const filename      = timestamp + "-" + argv.name + ".ts";

        await MigrationCreateCommand.createFile(process.cwd() + "/" + directory + "/" + filename, fileContent);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
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
        return `import {MigrationInterface} from "typeorm";

export class ${name}${timestamp} implements MigrationInterface {

    async up(queryRunner: QueryRunner, connection: Connection): Promise<any> {
    }

    async down(queryRunner: QueryRunner, connection: Connection): Promise<any> {
    }

}
`;
    }

}