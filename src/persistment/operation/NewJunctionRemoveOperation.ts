import {ObjectLiteral} from "../../common/ObjectLiteral";
import {RelationMetadata} from "../../metadata/RelationMetadata";

// todo: for both remove and insert can be used same object
export class NewJunctionRemoveOperation {

    // todo: we can send subjects instead of entities and junction entities if needed
    constructor(public relation: RelationMetadata,
                public entity: ObjectLiteral,
                public junctionEntityRelationIds: ObjectLiteral[]) {
    }

}