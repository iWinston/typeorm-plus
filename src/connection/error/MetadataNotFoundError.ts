export class MetadataNotFoundError extends Error {
    name = "MetadataNotFoundError";

    constructor(entityClass: Function) {
        super();
        this.message = `No metadata for ${entityClass} has been found!`;
    }

}