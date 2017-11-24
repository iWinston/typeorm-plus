/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export class EntityNotFoundError extends Error {
    name = "EntityNotFound";

    constructor(entityClass: string, criteria: string) {
        super();
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
        this.message = `Could not find any entity of type "${entityClass}" matching: ${criteria}`;
    }

}
