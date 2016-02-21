export class SchemaNotFoundError extends Error {
    name = "SchemaNotFoundError";

    constructor(documentClassOrName: string|Function) {
        super();
        this.message = `No schema for ${documentClassOrName} has been found!`;
    }

}