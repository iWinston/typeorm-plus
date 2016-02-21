export class RepositoryNotFoundError extends Error {
    name = "RepositoryNotFoundError";

    constructor(entityClass: Function) {
        super();
        this.message = `No repository for ${entityClass} has been found!`;
    }

}