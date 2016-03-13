export class RepositoryNotFoundError extends Error {
    name = "RepositoryNotFoundError";

    constructor(entityClass: Function) {
        super();
        this.message = `No repository for "${entityClass}" was found. Looks like this entity is not registered in your connection?`;
    }

}