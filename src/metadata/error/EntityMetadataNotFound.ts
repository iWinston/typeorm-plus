/**
 * @internal
 */
export class EntityMetadataNotFound extends Error {
    name = "EntityMetadataNotFound";

    constructor(target: Function) {
        super();
        const targetName = (<any> target).name ? (<any> target).name : target;
        this.message = `No metadata for "${targetName}" was found.`;
    }

}