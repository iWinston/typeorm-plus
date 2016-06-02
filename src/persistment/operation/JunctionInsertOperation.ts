import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 * @internal
 */
export class JunctionInsertOperation {
    constructor(public metadata: EntityMetadata,
                public entity1: any,
                public entity2: any,
                public entity1Target: Function|string,
                public entity2Target: Function|string) {
    }
}