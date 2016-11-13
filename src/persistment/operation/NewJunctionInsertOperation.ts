import {RelationMetadata} from "../../metadata/RelationMetadata";
import {Subject} from "../subject/Subject";
import {ObjectLiteral} from "../../common/ObjectLiteral";

export class NewJunctionInsertOperation {

    // todo: we can send subjects instead of entities and junction entities if needed
    constructor(public relation: RelationMetadata,
                public subject: Subject,
                public junctionEntities: ObjectLiteral[]) { // junctionEntities can be replaced with ids?
    }

}