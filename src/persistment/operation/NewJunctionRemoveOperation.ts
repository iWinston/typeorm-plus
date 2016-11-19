import {RelationMetadata} from "../../metadata/RelationMetadata";
import {Subject} from "../subject/Subject";

// todo: for both remove and insert can be used same object
export class NewJunctionRemoveOperation {

    // todo: we can send subjects instead of entities and junction entities if needed
    constructor(public relation: RelationMetadata,
                public subject: Subject,
                public junctionEntityRelationIds: any[]) {
    }

}