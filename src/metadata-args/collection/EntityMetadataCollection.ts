import {EntityMetadata} from "../../metadata/EntityMetadata";
import {EntityMetadataNotFound} from "../error/EntityMetadataNotFound";

/**
 * Array for the entity metadatas.
 */
export class EntityMetadataCollection extends Array<EntityMetadata> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    hasTarget(target: Function|string) {
        return !!this.find(metadata => metadata.target === target || (typeof target === "string" && metadata.targetName === target));
    }
    
    findByTarget(target: Function|string): EntityMetadata {
        const metadata = this.find(metadata => metadata.target === target || (typeof target === "string" && metadata.targetName === target));
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

    filter(callbackfn: (value: EntityMetadata, index?: number, array?: Array<EntityMetadata>) => any, thisArg?: any): EntityMetadataCollection {
        thisArg = thisArg || void 0;
        return this.reduce(function(out: EntityMetadataCollection, val: EntityMetadata, index: number, array: Array<EntityMetadata>) {
            if (callbackfn.call(thisArg, val, index, array)) {
                out.push(val);
            }
            return out;
        }, new EntityMetadataCollection());
    }
    
}