import * as fs from "fs";

/**
 * Generates a new subscriber.
 */
export class SubscriberCreateCommand {
    command = "subscriber:create";
    describe = "Generates a new subscriber.";

    builder(yargs: any) {
        return yargs
            // .option("c", {
            //     alias: "connection",
            //     default: "default",
            //     describe: "Name of the connection on which to run a query"
            // })
            .option("n", {
                alias: "name",
                describe: "Name of the subscriber class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where subscriber should be created.",
                demand: true
            });
    }

    async handler(argv: any) {
        const fileContent = SubscriberCreateCommand.getTemplate(argv.name);
        const directory = argv.dir;
        const filename = argv.name + ".ts";

        await SubscriberCreateCommand.createFile(process.cwd() + "/" + directory + "/" + filename, fileContent);
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
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import {EventSubscriber, EntitySubscriberInterface} from "typeorm";

@EventSubscriber()
export class ${name} implements EntitySubscriberInterface<any> {

}
`;
    }

}