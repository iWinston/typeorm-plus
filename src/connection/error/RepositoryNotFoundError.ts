/**
 * @internal
 */
export class RepositoryNotFoundError extends Error {
    name = "RepositoryNotFoundError";

    constructor(connectionName: string, entityClass: Function) {
        super();
        const targetName = (<any> entityClass).name ? (<any> entityClass).name : entityClass;
        this.message = `No repository for "${targetName}" was found. Looks like this entity is not registered in ` + 
            `current "${connectionName}" connection?`;
    }

}