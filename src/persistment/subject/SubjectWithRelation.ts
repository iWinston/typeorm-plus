import {ObjectLiteral} from "../../common/ObjectLiteral";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {Subject} from "./Subject";

/**
 */
export class SubjectWithRelation extends Subject {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    relation: RelationMetadata;
    relatedEntity: ObjectLiteral;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(relation: RelationMetadata,
                entity: ObjectLiteral,
                relatedEntity: ObjectLiteral) {
        super(relation.entityMetadata, entity);
        this.relation = relation;
        this.relatedEntity = relatedEntity;
    }

}