/**
 * @internal
 */
export class SchemaNotFoundError extends Error {
    name = "SchemaNotFoundError";

    constructor(entityClassOrName: string|Function) {
        super();
        const name = entityClassOrName instanceof Function ? (<any> entityClassOrName).name : entityClassOrName;
        this.message = `No schema for "${name}" was found. Looks like this entity is not registered in your connection?`;
    }

}