import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export interface JunctionRemoveOperation {
    metadata: EntityMetadata;
    entity1: any;
    entity2: any;
}