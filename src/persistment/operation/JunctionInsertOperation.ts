import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export interface JunctionInsertOperation {
    metadata: EntityMetadata;
    entity1: any;
    entity2: any;
}