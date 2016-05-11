import {EntityMetadata} from "../EntityMetadata";
import {EntityMetadataNotFound} from "../error/EntityMetadataNotFound";

/**
 * Array for the entity metadatas.
 */
export class EntityMetadataCollection extends Array<EntityMetadata> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    hasTarget(target: Function) {
        return !!this.find(metadata => metadata.target === target);
    }
    
    findByTarget(target: Function) {
        const metadata = this.find(metadata => metadata.target === target);
        if (!metadata)
            throw new EntityMetadataNotFound(target);
        
        return metadata;
    }

    findByName(name: string) {
        const metadata = this.find(metadata => metadata.name === name);
        if (!metadata)
            throw new EntityMetadataNotFound(name);
        
        return metadata;
    }
    
}