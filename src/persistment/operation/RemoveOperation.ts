import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export class RemoveOperation {
    constructor(public entity: any,
                public entityId: any,
                public fromMetadata: EntityMetadata, // todo: use relation.metadata instead?
                public relation: RelationMetadata|undefined,
                public fromEntityId: any) {
    }
}