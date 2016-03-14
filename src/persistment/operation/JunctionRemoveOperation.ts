import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export class JunctionRemoveOperation {
    constructor(public metadata: EntityMetadata,
                public entity1: any,
                public entity2: any) {
    }
}