import {Cursor} from "mongodb";
import {DocumentToEntityTransformer} from "../../query-builder/transformer/DocumentToEntityTransformer";
import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 * Special version of default mongodb Cursor, that takes care of transformation to entity
 * when its toArray method is called.
 */
export class EntityCursor<Entity> extends Cursor<Entity> {

    /**
     * Metadata of the entity whose this cursor is.
     */
    metadata: EntityMetadata;

    async toArray(): Promise<Entity[]> {
        const results = await super.toArray();

        // if for some reasons metadata is not set then return results as they are
        if (!this.metadata)
            return results;

        const transformer = new DocumentToEntityTransformer();
        return transformer.transformAll(results, this.metadata);
    }

}