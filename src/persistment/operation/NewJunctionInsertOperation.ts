import {ObjectLiteral} from "../../common/ObjectLiteral";
import {RelationMetadata} from "../../metadata/RelationMetadata";

export class NewJunctionInsertOperation {

    // todo: we can send subjects instead of entities and junction entities if needed
    constructor(public relation: RelationMetadata,
                public entity: ObjectLiteral,
                public junctionEntityRelationIds: any[]) { // junctionEntities can be replaced with ids?
    }

}