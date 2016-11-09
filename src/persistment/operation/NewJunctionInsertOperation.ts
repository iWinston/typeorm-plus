import {RelationMetadata} from "../../metadata/RelationMetadata";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Subject} from "../subject/Subject";

export class NewJunctionInsertOperation {

    // todo: we can send subjects instead of entities and junction entities if needed
    constructor(public relation: RelationMetadata,
                public subject: Subject,
                public junctionEntityRelationIds: any[]) { // junctionEntities can be replaced with ids?
    }

    get metadata(): EntityMetadata {
        return this.relation.entityMetadata;
    }

}