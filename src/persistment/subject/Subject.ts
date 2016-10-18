import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 */
export class Subject { // todo: move entity with id creation into metadata?

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    entityTarget: Function|string;
    entity: any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(public metadata: EntityMetadata, entity: ObjectLiteral) {
        // todo: check id usage
        this.entity = entity;
        this.entityTarget = metadata.target;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get id() {
        return this.metadata.getEntityIdMap(this.entity);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    compareId(id: ObjectLiteral): boolean { // todo: store metadata in this class and use compareIds of the metadata class instead of this duplication
        return this.metadata.compareIds(this.id, id);
    }

}