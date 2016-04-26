import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 * @internal
 */
export class JunctionInsertOperation {
    constructor(public metadata: EntityMetadata,
                public entity1: any,
                public entity2: any) {
    }
}