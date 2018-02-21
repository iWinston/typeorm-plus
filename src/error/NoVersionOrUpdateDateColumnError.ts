/**
 * Thrown when an entity does not have no version and no update date column.
 */
export class NoVersionOrUpdateDateColumnError extends Error {
    name = "NoVersionOrUpdateDateColumnError";

    constructor(entity: string) {
        super();
        this.message = `Entity ${entity} does not have version or update date columns.`;
        Object.setPrototypeOf(this, NoVersionOrUpdateDateColumnError.prototype);
        this.stack = new Error().stack;
    }

}