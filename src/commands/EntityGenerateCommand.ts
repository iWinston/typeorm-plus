import * as fs from "fs";

/**
 * Generates a new entity.
 */
export class EntityGenerateCommand {
    command = "entity:generate";
    describe = "Generates a new entity.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the entity class"
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where entity should be created."
            });
    }

    async handler(argv: any) {
        const fileContent = this.getTemplate(argv.name);
        const directory = argv.dir;
        const filename = argv.name + ".ts";

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
     * Gets contents of the entity file.
     */
    protected getTemplate(name: string): string {
        return `import {Table} from "typeorm";

@Table()
export class ${name} {

}
`;
    }

}