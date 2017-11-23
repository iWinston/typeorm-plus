/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export class EntityNotFoundError extends Error {
    name = "EntityNotFound";

    constructor() {
        super();
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
        this.message = `No such entity.`;
    }

}
