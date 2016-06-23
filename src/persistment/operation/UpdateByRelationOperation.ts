import {InsertOperation} from "./InsertOperation";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 */
export class UpdateByRelationOperation {
    constructor(public entityTarget: Function|string, // todo: probably must be entity metadata here?
                public targetEntity: any,
                public insertOperation: InsertOperation,
                public updatedRelation: RelationMetadata) {
    }
}