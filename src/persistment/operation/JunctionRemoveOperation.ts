import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 */
export class JunctionRemoveOperation {
    constructor(public metadata: EntityMetadata,
                public entity1: any,
                public entity2: any,
                public entity1Target: any,
                public entity2Target: any) {
    }
}