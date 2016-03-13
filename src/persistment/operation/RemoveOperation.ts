import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export interface RemoveOperation {
    entity: any;
    fromEntityId: any;
    metadata: EntityMetadata;
    relation: RelationMetadata;
}