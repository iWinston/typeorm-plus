import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 */
export class Subject { // todo: move entity with id creation into metadata? // todo: rename to EntityWithMetadata ?

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    metadata: EntityMetadata;
    entity: ObjectLiteral; // todo: rename to persistEntity, make it optional!
    databaseEntity?: ObjectLiteral;

    markedAsInserted: boolean = false;
    markedAsUpdated: boolean = false;
    markedAsRemoved: boolean = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral) {
        this.metadata = metadata;
        this.entity = entity!; // todo: temporary
        this.databaseEntity = databaseEntity;
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