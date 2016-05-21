import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * @internal
 */
export class UpdateByInverseSideOperation {
    constructor(public operationType: "update"|"remove",
                public targetEntity: any,
                public fromEntity: any,
                public fromRelation: RelationMetadata) {
    }
}