import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export class RemoveOperation {
    constructor(public metadata: EntityMetadata,
                public relation: RelationMetadata,
                public entity: any,
                public fromEntityId: any) {
    }
}