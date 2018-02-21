/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotTreeError extends Error {
    name = "RepositoryNotTreeError";

    constructor(entityClass: Function|string) {
        super();
        const targetName = typeof entityClass === "function" && (<any> entityClass).name ? (<any> entityClass).name : entityClass;
        this.message = `Repository of the "${targetName}" class is not a TreeRepository. Try to apply @Tree decorator on your entity.`;
        Object.setPrototypeOf(this, RepositoryNotTreeError.prototype);
        this.stack = new Error().stack;
    }

}