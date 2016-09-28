/**
 * Thrown when accessed to the class with entity metadata,
 * however on that time entity metadata is not set in the class.
 */
export class EntityMetadataNotSetError extends Error {
    name = "EntityMetadataNotSetError";

    constructor(type: Function, target: Function|string|undefined, tableName: string|undefined) {
        super();
        const targetMessage = target ? ` for ${ target instanceof Function ? (target.constructor as any).name : target }` : "";
        const tableNameMessage = tableName ? ` with ${ tableName } table name` : "";
        this.message = "Entity metadata" + targetMessage + tableNameMessage + " is not set in " + (type.constructor as any).name;
    }

}