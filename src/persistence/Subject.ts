import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SubjectChangeMap} from "./SubjectChangeMap";
import {InsertResult} from "../query-builder/result/InsertResult";

/**
 * Subject is a subject of persistence.
 * It holds information about each entity that needs to be persisted:
 * - what entity should be persisted
 * - what is database representation of the persisted entity
 * - what entity metadata of the persisted entity
 * - what is allowed to with persisted entity (insert/update/remove)
 *
 * Having this collection of subjects we can perform database queries.
 */
export class Subject {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata of the subject entity.
     */
    metadata: EntityMetadata;

    /**
     * Subject identifier.
     * This can be entity id or ids as well as some unique entity properties, like name or title.
     * Insert / Update / Remove operation will be executed by a given identifier.
     */
    identifier: ObjectLiteral|undefined = undefined;

    /**
     * Gets entity sent to the persistence (e.g. changed entity).
     * Throws error if persisted entity was not set.
     */
    entity?: ObjectLiteral;

    /**
     * Database entity.
     * THIS IS NOT RAW ENTITY DATA.
     */
    databaseEntity?: ObjectLiteral;

    /**
     * Changes needs to be applied in the database for the given subject.
     */
    changeMaps: SubjectChangeMap[] = [];

    /**
     * Indicates if this subject can be inserted into the database.
     * This means that this subject either is newly persisted, either can be inserted by cascades.
     */
    canBeInserted: boolean = false;

    /**
     * Indicates if this subject can be updated in the database.
     * This means that this subject either was persisted, either can be updated by cascades.
     */
    canBeUpdated: boolean = false;

    /**
     * Indicates if this subject MUST be removed from the database.
     * This means that this subject either was removed, either was removed by cascades.
     */
    mustBeRemoved: boolean = false;

    /**
     * If subject was just inserted, its insert result stored here.
     */
    insertResult?: InsertResult;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral) {
        this.metadata = metadata;
        this.entity = entity;
        this.databaseEntity = databaseEntity;
        if (entity) {
            this.identifier = this.metadata.isEntityIdMapEmpty(entity) ? undefined : this.metadata.getEntityIdMap(entity);

        } else if (databaseEntity) {
            this.identifier = this.metadata.isEntityIdMapEmpty(databaseEntity) ? undefined : this.metadata.getEntityIdMap(databaseEntity);
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Indicates if this subject has some changes needs to be inserted or updated.
     */
    hasChanges() {
        return this.changeMaps.length > 0;
    }

    /**
     * Checks if this subject must be inserted into the database.
     * Subject can be inserted into the database if it is allowed to be inserted (explicitly persisted or by cascades)
     * and if it does not have database entity set.
     */
    get mustBeInserted() {
        return this.canBeInserted && !this.databaseEntity;
    }

    /**
     * Checks if this subject must be updated into the database.
     * Subject can be updated in the database if it is allowed to be updated (explicitly persisted or by cascades)
     * and if it does have differentiated columns or relations.
     */
    get mustBeUpdated() {
        return this.canBeUpdated && this.identifier && this.hasChanges();
    }

}