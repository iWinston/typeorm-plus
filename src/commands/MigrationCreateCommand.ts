import * as fs from "fs";

/**
 * Creates a new migration file.
 */
export class MigrationCreateCommand {

    command = "migration:create";
    describe = "Creates a new migration file.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the migration class"
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migration should be created."
            });
    }

    async handler(argv: any) {
        const timestamp     = new Date().getTime();
        const fileContent   = this.getTemplate(argv.name, timestamp);
        const directory     = argv.dir; // || "./migrations";
        const filename      = timestamp + "-" + argv.name;

        await this.createFile(directory + "/" + filename, fileContent);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a file with the given content in the given path.
     */
    protected createFile(path: string, content: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            fs.writeFile(path, content, err => err ? fail(err) : ok());
        });
    }

    /**
     * Gets contents of the migration file.
     */
    protected getTemplate(name: string, timestamp: number): string {
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