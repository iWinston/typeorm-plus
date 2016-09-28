/**
 * Thrown when user tries to execute operation that requires connection to be established.
 */
export class EntityMetadataAlreadySetError extends Error {
    name = "EntityMetadataAlreadySetError";

    constructor(type: Function, target: Function|string|undefined, tableName: string|undefined) {
        super();
        const targetMessage = target ? ` for ${ target instanceof Function ? (target.constructor as any).name : target }` : "";
        const tableNameMessage = tableName ? ` with ${ tableName } table name` : "";
        this.message = "Entity metadata" + targetMessage + tableNameMessage + " has been already set to this " + (type.constructor as any).name;
    }

}