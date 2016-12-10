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
                describe: "Name of the migration class and file"
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migrations should be created. Default is \"./migrations\""
            });
    }

    async handler(argv: any) {
        const fileContents = this.getTemplate(argv.name);
        const directory = argv.dir || "./migrations";
        const filename = new Date().getTime() + "-" + argv.name;

        this.createFile(directory + "/" + filename, fileContents);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createFile(path: string, contents: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            fs.writeFile(path, contents, err => err ? fail(err) : ok());
        });
    }

    protected getTemplate(name: string): string {
        return `import {MigrationInterface} from "typeorm";

export class ${name} implements MigrationInterface {

    async up(queryRunner: QueryRunner, connection: Connection): Promise<any> {
    }

    async down(queryRunner: QueryRunner, connection: Connection): Promise<any> {
    }

}`;
    }

}