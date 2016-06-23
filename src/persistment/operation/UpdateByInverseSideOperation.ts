import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 */
export class UpdateByInverseSideOperation {
    constructor(public entityTarget: Function|string, // todo: probably must be entity metadata here?
                public fromEntityTarget: Function|string,
                public operationType: "update"|"remove",
                public targetEntity: any,
                public fromEntity: any,
                public fromRelation: RelationMetadata) {
    }
}