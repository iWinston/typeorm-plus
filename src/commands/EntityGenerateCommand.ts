import * as fs from "fs";

/**
 * Generates a new entity.
 */
export class EntityGenerateCommand {
    command = "entity:generate";
    describe = "Generates a new entity.";

    builder(yargs: any) {
        return yargs
            // .option("c", {
            //     alias: "connection",
            //     default: "default",
            //     describe: "Name of the connection on which to run a query"
            // })
            .option("n", {
                alias: "name",
                describe: "Name of the entity class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where entity should be created.",
                demand: true
            });
    }

    async handler(argv: any) {
        const fileContent = EntityGenerateCommand.getTemplate(argv.name);
        const directory = argv.dir;
        const filename = argv.name + ".ts";

        await EntityGenerateCommand.createFile(process.cwd() + "/" + directory + "/" + filename, fileContent);
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
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import {Table} from "typeorm";

@Table()
export class ${name} {

}
`;
    }

}