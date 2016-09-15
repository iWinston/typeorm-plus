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
            });
    }

    async handler(argv: any) {
        // todo.
    }
}