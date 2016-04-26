import {EntityMetadata} from "./EntityMetadata";

/**
 * Array for the entity metadatas.
 *
 * @internal
 */
export class EntityMetadataArray extends Array<EntityMetadata> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    findByTarget(target: Function) {
        return this.find(metadata => metadata.target === target);
    }
    
}