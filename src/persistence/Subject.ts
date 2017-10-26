import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {DateUtils} from "../util/DateUtils";
import {OrmUtils} from "../util/OrmUtils";
import {ChangeMap} from "./ChangeMap";

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
     * Subject identifier.
     * This can be entity id or ids as well as some unique entity properties, like name or title.
     * Insert / Update / Remove operation will be executed by a given identifier.
     */
    identifier: ObjectLiteral|undefined = undefined;

    /**
     * Changes needs to be applied in the database for the given subject.
     */
    changeMaps: ChangeMap[] = [];

    /**
     * Entity metadata of the subject entity.
     */
    metadata: EntityMetadata;

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
        return this.canBeInserted && this.identifier === undefined && this.hasChanges();
    }

    /**
     * Checks if this subject must be updated into the database.
     * Subject can be updated in the database if it is allowed to be updated (explicitly persisted or by cascades)
     * and if it does have differentiated columns or relations.
     */
    get mustBeUpdated() {
        return this.canBeUpdated && this.identifier !== undefined && this.hasChanges();
    }

    createChangeSet() {
        return this.changeMaps.reduce((updateMap, changeMap) => {
            let value = changeMap.value;
            if (value instanceof Subject)
                value = value.identifier;

            if (changeMap.column) {
                OrmUtils.mergeDeep(updateMap, changeMap.column.createValueMap(value));

            } else if (changeMap.relation) {
                changeMap.relation!.joinColumns.forEach(column => {
                    OrmUtils.mergeDeep(updateMap, column.createValueMap(value));
                });
            }
            return updateMap;
        }, {} as ObjectLiteral);
    }

    buildIdentifier() {
        return this.metadata.primaryColumns.reduce((identifier, column) => {
            if (column.isGenerated && this.generatedMap) {
                return OrmUtils.mergeDeep(identifier, column.createValueMap(this.generatedMap[column.databaseName]));
            } else {
                return OrmUtils.mergeDeep(identifier, column.getEntityValueMap(this.entity));
            }
        }, {} as ObjectLiteral);
    }

    buildJunctionIdentifier() {

    }

    /**
     * Indicates if this is an exist subject that must be removed from the database.
     */
    // mustBeRemoved() {
    //     return this.idenifier !== undefined && this.hasChanges();
    // }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Persist entity (changed entity).
     */
    private _persistEntity?: ObjectLiteral;

    /**
     * Database entity.
     */
    private _databaseEntity?: ObjectLiteral;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Date when this entity is persisted.
     */
    readonly date: Date = new Date();

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

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
     * When subject is newly persisted it may have a generated entity id.
     * In this case it should be written here.
     */
    generatedMap?: ObjectLiteral;

    /**
     * Generated id of the parent entity. Used in the class-table-inheritance.
     */
    parentGeneratedId?: any;

    /**
     * Used in newly persisted entities which are tree tables.
     */
    treeLevel?: number;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral) {
        this.metadata = metadata;
        this._persistEntity = entity;
        this._databaseEntity = databaseEntity;
        if (entity) {
            this.identifier = this.metadata.isEntityIdMapEmpty(entity) ? undefined : this.metadata.getEntityIdMap(entity);

        } else if (databaseEntity) {
            this.identifier = this.metadata.isEntityIdMapEmpty(databaseEntity) ? undefined : this.metadata.getEntityIdMap(databaseEntity);
        }
        this.recompute(); // todo: optimize
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets all relation property paths that exist in the persisted entity.
     */
    get persistedEntityRelationPropertyPaths(): string[] {
        return this.metadata.relations
            .filter(relation => relation.getEntityValue(this.entity) !== undefined)
            .map(relation => relation.propertyPath);
    }

    /**
     * Gets entity sent to the persistence (e.g. changed entity).
     * Throws error if persisted entity was not set.
     */
    get entity(): ObjectLiteral {
        if (!this._persistEntity)
            throw new Error(`Persistence entity is not set for the given subject.`);

        return this._persistEntity;
    }

    /**
     * Checks if subject has a persisted entity.
     */
    get hasEntity(): boolean {
        return !!this._persistEntity;
    }

    /**
     * Gets entity from the database (e.g. original entity).
     * THIS IS NOT RAW ENTITY DATA.
     * Throws error if database entity was not set.
     */
    get databaseEntity(): ObjectLiteral {
        if (!this._databaseEntity)
            throw new Error(`Database entity is not set for the given subject.`);

        return this._databaseEntity;
    }

    /**
     * Checks if subject has a database entity.
     */
    get hasDatabaseEntity(): boolean {
        return !!this._databaseEntity;
    }

    /**
     * Sets entity from the database (e.g. original entity).
     * Once database entity set it calculates differentiated columns and relations
     * between persistent entity and database entity.
     */
    set databaseEntity(databaseEntity: ObjectLiteral) {
        this._databaseEntity = databaseEntity;
        if (!this.identifier)
            this.identifier = this.metadata.isEntityIdMapEmpty(databaseEntity) ? undefined : this.metadata.getEntityIdMap(databaseEntity);
        this.recompute();
    }

    /**
     * Gets entity target from the entity metadata of this subject.
     */
    get entityTarget(): Function|string {
        return this.metadata.target;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Validates this subject for errors.
     * Subject cannot be at the same time inserted and updated, removed and inserted, removed and updated.
     */
    validate() {

        if (this.mustBeInserted && this.mustBeRemoved)
            throw new Error(`Removed entity ${this.metadata.name} is also scheduled for insert operation. This looks like ORM problem. Please report a github issue.`);

        if (this.mustBeUpdated && this.mustBeRemoved)
            throw new Error(`Removed entity "${this.metadata.name}" is also scheduled for update operation. ` +
                `Make sure you are not updating and removing same object (note that update or remove may be executed by cascade operations).`);

        if (this.mustBeInserted && this.mustBeUpdated)
            throw new Error(`Inserted entity ${this.metadata.name} is also scheduled for updated operation. This looks like ORM problem. Please report a github issue.`);

    }

    /**
     * Performs entity re-computations.
     */
    recompute() {
        if (this.hasEntity) {
            this.computeDiffColumns();
            this.computeDiffRelationalColumns();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Differentiate columns from the updated entity and entity stored in the database.
     */
    protected computeDiffColumns(): void {
        const diffColumns = this.metadata.columns.filter(column => {

            // prepare both entity and database values to make comparision
            let entityValue = column.getEntityValue(this.entity);
            if (entityValue === undefined)
                return false;
            if (!this.hasDatabaseEntity)
                return true;

            let databaseValue = column.getEntityValue(this.databaseEntity);

            // normalize special values to make proper comparision (todo: arent they already normalized at this point?!)
            if (entityValue !== null && entityValue !== undefined) {
                if (column.type === "date") {
                    entityValue = DateUtils.mixedDateToDateString(entityValue);

                } else if (column.type === "time") {
                    entityValue = DateUtils.mixedDateToTimeString(entityValue);

                } else if (column.type === "datetime" || column.type === Date) {
                    entityValue = DateUtils.mixedDateToUtcDatetimeString(entityValue);
                    databaseValue = DateUtils.mixedDateToUtcDatetimeString(databaseValue);

                } else if (column.type === "json" || column.type === "jsonb") {
                    entityValue = JSON.stringify(entityValue);
                    if (databaseValue !== null && databaseValue !== undefined)
                        databaseValue = JSON.stringify(databaseValue);

                } else if (column.type === "sample-array") {
                    entityValue = DateUtils.simpleArrayToString(entityValue);
                    databaseValue = DateUtils.simpleArrayToString(databaseValue);
                }
            }

            // if its a special column or value is not changed - then do nothing
            if (column.isVirtual ||
                column.isParentId ||
                column.isDiscriminator ||
                column.isUpdateDate ||
                column.isVersion ||
                column.isCreateDate ||
                entityValue === databaseValue)
                return false;

            // filter out "relational columns" only in the case if there is a relation object in entity
            if (column.relationMetadata) {
                const value = column.relationMetadata.getEntityValue(this.entity);
                if (value !== null && value !== undefined)
                    return false;
            }

            return true;
        });
        diffColumns.forEach(column => {
            let changeMap = this.changeMaps.find(changeMap => changeMap.column === column);
            if (changeMap) {
                changeMap.value = column.getEntityValue(this.entity);

            } else {
                changeMap = {
                    column: column,
                    value: column.getEntityValue(this.entity)
                };
                this.changeMaps.push(changeMap);
            }
        });
    }

    /**
     * Difference columns of the owning one-to-one and many-to-one columns.
     */
    protected computeDiffRelationalColumns(/*todo: updatesByRelations: UpdateByRelationOperation[], */): void {
        const diffRelations = this.metadata.relationsWithJoinColumns.filter(relation => {
            if (!this.hasDatabaseEntity)
                return true;

            // here we cover two scenarios:
            // 1. related entity can be another entity which is natural way
            // 2. related entity can be entity id which is hacked way of updating entity
            // todo: what to do if there is a column with relationId? (cover this too?)
            let relatedEntity = relation.getEntityValue(this.entity);

            // we don't perform operation over undefined properties (but we DO need null properties!)
            if (relatedEntity === undefined)
                return false;

            // if relation entity is just a relation id set (for example post.tag = 1)
            // then we create an id map from it to make a proper compare
            if (relatedEntity !== null && !(relatedEntity instanceof Object))
                relatedEntity = relation.getRelationIdMap(relatedEntity);

            const databaseRelatedEntity = relation.getEntityValue(this.databaseEntity);

            // todo: try to find if there is update by relation operation - we dont need to generate update relation operation for this
            // todo: if (updatesByRelations.find(operation => operation.targetEntity === this && operation.updatedRelation === relation))
            // todo:     return false;

            // if relation ids aren't equal then we need to update them
            return !relation.inverseEntityMetadata.compareIds(relatedEntity, databaseRelatedEntity);
        });

        diffRelations.forEach(relation => {
            let changeMap = this.changeMaps.find(changeMap => changeMap.relation === relation);
            if (changeMap) {
                changeMap.value = relation.getEntityValue(this.entity);

            } else {
                changeMap = {
                    relation: relation,
                    value: relation.getEntityValue(this.entity)
                };
                this.changeMaps.push(changeMap);
            }
        });
    }

}

// you'll need this code later
// add operations for removed relations
// if (removedRelatedEntityRelationIds.length) {
//     const updateUnsetColumns = relation.inverseRelation!.joinColumns.reduce((map, column) => {
//         return OrmUtils.mergeDeep(map, column.createValueMap(null));
//     }, {} as ObjectLiteral);
//
//     operations.push({
//         metadata: relation.inverseEntityMetadata!,
//         updateValues: updateUnsetColumns,
//         condition: removedRelatedEntityRelationIds,
//     });
// }
