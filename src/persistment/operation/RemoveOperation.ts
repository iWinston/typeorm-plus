import {RelationMetadata} from "../../metadata/RelationMetadata";
import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 * @internal
 */
export class RemoveOperation {
    constructor(public entity: any,
                public entityId: any,
                public fromMetadata: EntityMetadata, // todo: use relation.metadata instead?
                public relation: RelationMetadata|undefined,
                public fromEntityId: any) {
    }
}