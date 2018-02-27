import {EntitySchema} from "../index";

/**
 */
export class EntityMetadataNotFound extends Error {
    name = "EntityMetadataNotFound";

    constructor(target: Function|EntitySchema<any>|string) {
        super();
        let targetName: string;
        if (target instanceof EntitySchema) {
            targetName = target.options.name;
        } else if (typeof target === "function") {
            targetName = target.name;
        } else {
            targetName = target;
        }
        this.message = `No metadata for "${targetName}" was found.`;
        Object.setPrototypeOf(this, EntityMetadataNotFound.prototype);
        this.stack = new Error().stack;
    }

}