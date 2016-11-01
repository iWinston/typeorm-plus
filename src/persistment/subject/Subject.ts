import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 */
export class Subject { // todo: move entity with id creation into metadata?

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    metadata: EntityMetadata;
    entity: ObjectLiteral;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(metadata: EntityMetadata, entity: ObjectLiteral) {
        this.metadata = metadata;
        this.entity = entity;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get entityTarget(): Function|string {
        return this.metadata.target;
    }

    get id() {
        return this.metadata.getEntityIdMap(this.entity);
    }

    get mixedId() {
        return this.metadata.getEntityIdMixedMap(this.entity);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    compareId(id: ObjectLiteral): boolean { // todo: store metadata in this class and use compareIds of the metadata class instead of this duplication
        return this.metadata.compareIds(this.id, id);
    }

}