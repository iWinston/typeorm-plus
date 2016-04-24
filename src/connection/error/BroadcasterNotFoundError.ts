/**
 * @internal
 */
export class BroadcasterNotFoundError extends Error {
    name = "BroadcasterNotFoundError";

    constructor(entityClassOrName: string|Function) {
        super();
        const name = entityClassOrName instanceof Function ? (<any> entityClassOrName).name : entityClassOrName;
        this.message = `No broadcaster for "${name}" was found. Looks like this entity is not registered in your connection?`;
    }

}