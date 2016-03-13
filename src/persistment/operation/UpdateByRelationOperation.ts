import {InsertOperation} from "./InsertOperation";
import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";

export class UpdateByRelationOperation {
    constructor(public targetEntity: any,
                public insertOperation: InsertOperation,
                public updatedRelation: RelationMetadata) {
    }
}