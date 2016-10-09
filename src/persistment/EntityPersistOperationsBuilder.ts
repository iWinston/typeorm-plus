import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {PersistOperation, OperateEntity} from "./operation/PersistOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {CascadesNotAllowedError} from "./error/CascadesNotAllowedError";
import {RemoveOperation} from "./operation/RemoveOperation";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {UpdateByInverseSideOperation} from "./operation/UpdateByInverseSideOperation";
import {JunctionRemoveOperation} from "./operation/JunctionRemoveOperation";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * 1. collect all exist objects from the db entity
 * 2. collect all objects from the new entity
 * 3. first need to go throw all relations of the new entity and:
 *      3.1. find all objects that are new (e.g. cascade="insert") by comparing ids from the exist objects
 *      3.2. check if relation has rights to do cascade operation and throw exception if it cannot
 *      3.3. save new objects for insert operation
 * 4. second need to go throw all relations of the db entity and:
 *      4.1. find all objects that are removed (e.g. cascade="remove") by comparing data with collected objects of the new entity
 *      4.2. check if relation has rights to do cascade operation and throw exception if it cannot
 *      4.3. save new objects for remove operation
 * 5. third need to go throw collection of all new entities
 *      5.1. compare with entities from the collection of db entities, find difference and generate a change set
 *      5.2. check if relation has rights to do cascade operation and throw exception if it cannot
 *      5.3.
 * 6. go throw all relations and find junction
 *      6.1.
 *      
 * if relation has "all" then all of above:
 * if relation has "insert" it can insert a new entity
 * if relation has "update" it can only update related entity
 * if relation has "remove" it can only remove related entity
 */
export class EntityPersistOperationBuilder {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------
    
    private strictCascadesMode = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private entityMetadatas: EntityMetadataCollection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    buildFullPersistment(dbEntity: OperateEntity|undefined,
                         persistedEntity: OperateEntity,
                         dbEntities: OperateEntity[],
                         allPersistedEntities: OperateEntity[]): PersistOperation {
        
        // const dbEntities = this.extractObjectsById(dbEntity, metadata);
        // const allPersistedEntities = this.extractObjectsById(persistedEntity, metadata);
        const metadata = persistedEntity.metadata;

        const persistOperation = new PersistOperation();
        persistOperation.dbEntity = dbEntity;
        persistOperation.persistedEntity = persistedEntity;
        persistOperation.allDbEntities = dbEntities;
        persistOperation.allPersistedEntities = allPersistedEntities;
        persistOperation.inserts = this.findCascadeInsertedEntities(persistedEntity, dbEntities);
        persistOperation.updatesByRelations = this.updateRelations(persistOperation.inserts, persistedEntity);
        persistOperation.updatesByInverseRelations = this.updateInverseRelations(metadata, dbEntity, persistedEntity);
        if (dbEntity)
            persistOperation.updates = this.findCascadeUpdateEntities(persistOperation.updatesByRelations, metadata, dbEntity, persistedEntity, dbEntities);
        persistOperation.junctionInserts = this.findJunctionInsertOperations(metadata, persistedEntity, dbEntities);
        if (dbEntity)
            persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allPersistedEntities, undefined, undefined, undefined);
        if (dbEntity)
            persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allPersistedEntities);

        // persistOperation.log();

        return persistOperation;
    }

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    buildOnlyRemovement(metadata: EntityMetadata,
                        dbEntity: OperateEntity,
                        persistedEntity: OperateEntity,
                        dbEntities: OperateEntity[],
                        allPersistedEntities: OperateEntity[]): PersistOperation {
        // const dbEntities = this.extractObjectsById(dbEntity, metadata);
        // const allEntities = this.extractObjectsById(newEntity, metadata);

        const persistOperation = new PersistOperation();
        persistOperation.dbEntity = dbEntity;
        persistOperation.persistedEntity = persistedEntity;
        persistOperation.allDbEntities = dbEntities;
        persistOperation.allPersistedEntities = allPersistedEntities;
        if (dbEntity) {
            persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allPersistedEntities, undefined, undefined, undefined);
        }
        persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allPersistedEntities);

        return persistOperation;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private findCascadeInsertedEntities(newEntityWithId: OperateEntity,
                                        dbEntities: OperateEntity[],
                                        fromRelation?: RelationMetadata,
                                        operations: InsertOperation[] = []): InsertOperation[] {
        const newEntity = newEntityWithId.entity;
        const metadata = this.entityMetadatas.findByTarget(newEntityWithId.entityTarget);
        const isObjectNew = !this.findEntityWithId(dbEntities, metadata.target, metadata.getEntityIdMap(newEntity)!);

        // if object is new and should be inserted, we check if cascades are allowed before add it to operations list
        if (isObjectNew && fromRelation && !this.checkCascadesAllowed("insert", metadata, fromRelation)) {
            return operations; // looks like object is new here, but cascades are not allowed - then we should stop iteration

        } else if (isObjectNew && !operations.find(o => o.entity === newEntity)) { // object is new and cascades are allow here
            operations.push(new InsertOperation(newEntityWithId.entityTarget, newEntity));
        }

        metadata.relations.forEach(relation => {
            const value = this.getEntityRelationValue(relation, newEntity);
            const inverseMetadata = relation.inverseEntityMetadata;
            if (!value) return;

            if (value instanceof Array) {
                value.forEach((subValue: any) => {
                    const subValueWithId = new OperateEntity(inverseMetadata, subValue);
                    this.findCascadeInsertedEntities(subValueWithId, dbEntities, relation, operations);
                });
            } else {
                const valueWithId = new OperateEntity(inverseMetadata, value);
                this.findCascadeInsertedEntities(valueWithId, dbEntities, relation, operations);
            }
        });

        return operations;
    }

    private findCascadeUpdateEntities(updatesByRelations: UpdateByRelationOperation[],
                                      metadata: EntityMetadata,
                                      dbEntityWithId: OperateEntity,
                                      newEntityWithId: OperateEntity,
                                      dbEntities: OperateEntity[],
                                      fromRelation?: RelationMetadata,
                                      operations: UpdateOperation[] = []): UpdateOperation[] {
        const dbEntity = dbEntityWithId.entity;
        const newEntity = newEntityWithId.entity;
        
        if (!dbEntity)
            return operations;

        const diffColumns = this.diffColumns(metadata, newEntity, dbEntity);
        const diffRelations = this.diffRelations(updatesByRelations, metadata, newEntity, dbEntity);
        if (diffColumns.length && fromRelation && !this.checkCascadesAllowed("update", metadata, fromRelation)) {
            return operations;

        } else if (diffColumns.length || diffRelations.length) {
            const entityId = metadata.getEntityIdMap(newEntity);
            if (entityId)
                operations.push(new UpdateOperation(newEntityWithId.entityTarget, newEntity, entityId, diffColumns, diffRelations));
        }

        metadata.relations.forEach(relation => {
            const relMetadata = relation.inverseEntityMetadata;
            const relationIdColumnName = relMetadata.firstPrimaryColumn.propertyName; // todo: join column metadata should be used here instead of primary column
            const value = this.getEntityRelationValue(relation, newEntity);
            const referencedColumnName = relation.isOwning ? relation.referencedColumnName : relation.inverseRelation.referencedColumnName;
            // const dbValue = this.getEntityRelationValue(relation, dbEntity);

            if (!value/* || !dbValue*/)
                return;

            if (value instanceof Array) {
                value.forEach((subEntity: any) => {
                    /*const subDbEntity = dbValue.find((subDbEntity: any) => {
                        return subDbEntity[relationIdColumnName] === subEntity[relationIdColumnName];
                    });*/
                    const dbValue = dbEntities.find(dbValue => {
                        return dbValue.entityTarget === relation.entityMetadata.target && dbValue.entity[referencedColumnName] === subEntity[relationIdColumnName];
                    });
                    if (dbValue) {
                        const dbValueWithId = new OperateEntity(relMetadata, dbValue.entity);
                        const subEntityWithId = new OperateEntity(relMetadata, subEntity);
                        this.findCascadeUpdateEntities(updatesByRelations, relMetadata, dbValueWithId, subEntityWithId, dbEntities, relation, operations);
                    }
                });
                
            } else {
                const dbValue = dbEntities.find(dbValue => {
                    return dbValue.entityTarget === relation.entityMetadata.target && dbValue.entity[referencedColumnName] === value[relationIdColumnName];
                });
                if (dbValue) {
                    const dbValueWithId = new OperateEntity(relMetadata, dbValue.entity);
                    const valueWithId = new OperateEntity(relMetadata, value);
                    this.findCascadeUpdateEntities(updatesByRelations, relMetadata, dbValueWithId, valueWithId, dbEntities, relation, operations);
                }
            }
        });

        return operations;
    }

    private findCascadeRemovedEntities(metadata: EntityMetadata,
                                       dbEntityWithId: OperateEntity,
                                       allPersistedEntities: OperateEntity[],
                                       fromRelation: RelationMetadata|undefined,
                                       fromMetadata: EntityMetadata|undefined,
                                       fromEntityId: ObjectLiteral|undefined,
                                       parentAlreadyRemoved: boolean = false): RemoveOperation[] {
        const dbEntity = dbEntityWithId.entity;

        let operations: RemoveOperation[] = [];

        const entityId = metadata.getEntityIdMap(dbEntity)!;
        const isObjectRemoved = parentAlreadyRemoved || !this.findEntityWithId(allPersistedEntities, metadata.target, entityId);

        // if object is removed and should be removed, we check if cascades are allowed before add it to operations list
        if (isObjectRemoved && fromRelation && !this.checkCascadesAllowed("remove", metadata, fromRelation)) {
            return operations; // looks like object is removed here, but cascades are not allowed - then we should stop iteration

        } else if (isObjectRemoved) {  // object is remove and cascades are allow here
            operations.push(new RemoveOperation(dbEntityWithId.entityTarget, dbEntity, entityId, <EntityMetadata> fromMetadata, fromRelation, fromEntityId));
        }

        metadata.relations.forEach(relation => {
            const dbValue = this.getEntityRelationValue(relation, dbEntity);
            const relMetadata = relation.inverseEntityMetadata;
            if (!dbValue) return;
            
            if (dbValue instanceof Array) {
                dbValue.forEach((subDbEntity: any) => {
                    if (subDbEntity) {
                        const subDbEntityWithId = new OperateEntity(relMetadata, subDbEntity);

                        const relationOperations = this.findCascadeRemovedEntities(relMetadata, subDbEntityWithId, allPersistedEntities, relation, metadata, metadata.getEntityIdMap(dbEntity), isObjectRemoved);
                        relationOperations.forEach(o => operations.push(o));
                    }
                });
            } else if (dbValue) {
                const dbValueWithId = new OperateEntity(relMetadata, dbValue);
                
                const relationOperations = this.findCascadeRemovedEntities(relMetadata, dbValueWithId, allPersistedEntities, relation, metadata, metadata.getEntityIdMap(dbEntity), isObjectRemoved);
                relationOperations.forEach(o => operations.push(o));
            }
        }, []);

        return operations;
    }

    private updateInverseRelations(metadata: EntityMetadata,
                                   dbOperateEntity: OperateEntity|undefined,
                                   newOperateEntity: OperateEntity,
                                   operations: UpdateByInverseSideOperation[] = []): UpdateByInverseSideOperation[] { // todo: why its not called recursively?
        // const dbEntity = dbOperateEntity.entity;
        const newEntity = newOperateEntity.entity;
        metadata.relations
            .filter(relation => relation.isOneToMany) // todo: maybe need to check isOneToOne and not owner
            // .filter(relation => newEntity[relation.propertyName] instanceof Array) // todo: what to do with empty relations? need to set to NULL from inverse side?
            .forEach(relation => {
                const relationMetadata = relation.inverseEntityMetadata;
                
                // to find new objects in relation go throw all objects in newEntity and check if they don't exist in dbEntity
                if (newEntity && newEntity[relation.propertyName] instanceof Array) {
                    if (!dbOperateEntity) { // if there are no items in dbEntity - then all items in newEntity are new
                        newEntity[relation.propertyName].forEach((subEntity: any) => {
                            operations.push(new UpdateByInverseSideOperation(relationMetadata.target, newOperateEntity.entityTarget, "update", subEntity, newEntity, relation));
                        });
                    } else {
                        newEntity[relation.propertyName].filter((newSubEntity: any) => {
                            if (!dbOperateEntity.entity[relation.propertyName])
                                return true;

                            return !dbOperateEntity.entity[relation.propertyName].find((dbSubEntity: any) => {
                                return relation.inverseEntityMetadata.compareEntities(newSubEntity, dbSubEntity);
                            });
                        }).forEach((subEntity: any) => {
                            operations.push(new UpdateByInverseSideOperation(relationMetadata.target, newOperateEntity.entityTarget, "update", subEntity, newEntity, relation));
                        });
                    }
                }
                
                // we also need to find removed elements. to find them need to traverse dbEntity and find its elements missing in newEntity
                if (dbOperateEntity && dbOperateEntity.entity[relation.propertyName] instanceof Array) {
                    dbOperateEntity.entity[relation.propertyName].filter((dbSubEntity: any) => {
                        if (!newEntity /* are you sure about this? */ || !newEntity[relation.propertyName]) // if there are no items in newEntity - then all items in dbEntity are removed
                            return true;

                        return !newEntity[relation.propertyName].find((newSubEntity: any) => {
                            return relation.inverseEntityMetadata.compareEntities(dbSubEntity, newSubEntity);
                        });
                    }).forEach((subEntity: any) => {
                        operations.push(new UpdateByInverseSideOperation(relationMetadata.target, newOperateEntity.entityTarget, "remove", subEntity, newEntity, relation));
                    });
                }
                
            });
        
        return operations;
    }

    /**
     * To update relation, you need:
     *   update table where this relation (owner side)
     *   set its relation property to inserted id
     *   where
     *
     */

    private updateRelations(insertOperations: InsertOperation[], newEntity: OperateEntity): UpdateByRelationOperation[] {
        return insertOperations.reduce((operations, insertOperation) => {
            return operations.concat(this.findRelationsWithEntityInside(insertOperation, newEntity));
        }, <UpdateByRelationOperation[]> []);
    }

    private findRelationsWithEntityInside(insertOperation: InsertOperation, entityToSearchInWithId: OperateEntity): UpdateByRelationOperation[] {
        const entityToSearchIn = entityToSearchInWithId.entity;
        const metadata = this.entityMetadatas.findByTarget(entityToSearchInWithId.entityTarget);

        const operations: UpdateByRelationOperation[] = [];
        metadata.relations.forEach(relation => {
            const value = this.getEntityRelationValue(relation, entityToSearchIn);
            const inverseMetadata = relation.inverseEntityMetadata;
            if (!value) return;

            if (value instanceof Array) {
                value.forEach((sub: any) => {

                    if (!relation.isManyToMany && sub === insertOperation.entity)
                        operations.push(new UpdateByRelationOperation(entityToSearchInWithId.entityTarget, entityToSearchIn, insertOperation, relation));

                    const subWithId = new OperateEntity(inverseMetadata, sub);
                    const subOperations = this.findRelationsWithEntityInside(insertOperation, subWithId);
                    subOperations.forEach(o => operations.push(o));
                });

            } else if (value) {

                if (value === insertOperation.entity) {
                    operations.push(new UpdateByRelationOperation(entityToSearchInWithId.entityTarget, entityToSearchIn, insertOperation, relation));
                }

                const valueWithId = new OperateEntity(inverseMetadata, value);
                const subOperations = this.findRelationsWithEntityInside(insertOperation, valueWithId);
                subOperations.forEach(o => operations.push(o));

            }
        });
        
        return operations;
    }

    private findJunctionInsertOperations(metadata: EntityMetadata, newEntityWithId: OperateEntity, dbEntities: OperateEntity[], isRoot = true): JunctionInsertOperation[] {
        const newEntity = newEntityWithId.entity;
        const dbEntity = dbEntities.find(dbEntity => {
            return dbEntity.compareId(metadata.getEntityIdMap(newEntity)!) && dbEntity.entityTarget === metadata.target;
        });
        return metadata.relations.reduce((operations, relation) => {
            const relationMetadata = relation.inverseEntityMetadata;
            const value = this.getEntityRelationValue(relation, newEntity);
                        
            if (value === null || value === undefined)
                return operations;

            const dbValue = dbEntity ? this.getEntityRelationValue(relation, dbEntity.entity) : null;

            if (value instanceof Array) {
                value.forEach((subEntity: any) => {

                    if (relation.isManyToMany) {
                        const relationIdProperty = relationMetadata.firstPrimaryColumn.propertyName; // todo: join column metadata should be used instead of primaryColumn
                        const has = !dbValue || !dbValue.find((e: any) => e[relationIdProperty] === subEntity[relationIdProperty]);

                        if (has) {
                            operations.push({
                                metadata: relation.junctionEntityMetadata,
                                entity1: newEntity,
                                entity2: subEntity,
                                entity1Target: newEntityWithId.entityTarget,
                                entity2Target: relationMetadata.target
                            });
                        }
                    }

                    if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                        const subEntityWithId = new OperateEntity(relationMetadata, subEntity);
                        const subOperations = this.findJunctionInsertOperations(relationMetadata, subEntityWithId, dbEntities, false);
                        subOperations.forEach(o => operations.push(o));
                    }
                });
            } else {
                if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                    const valueWithId = new OperateEntity(relationMetadata, value);
                    const subOperations = this.findJunctionInsertOperations(relationMetadata, valueWithId, dbEntities, false);
                    subOperations.forEach(o => operations.push(o));
                }
            }

            return operations;
        }, <JunctionInsertOperation[]> []);
    }

    private findJunctionRemoveOperations(metadata: EntityMetadata, dbEntityWithId: OperateEntity, newEntities: OperateEntity[], isRoot = true): JunctionInsertOperation[] {
        const dbEntity = dbEntityWithId.entity;
        // if (!dbEntity) // if new entity is persisted then it does not have anything to be deleted
        //     return [];

        const newEntity = newEntities.find(newEntity => {
            return newEntity.compareId(dbEntity) && newEntity.entityTarget === metadata.target;
        });
        return metadata.relations
            .filter(relation => dbEntity[relation.propertyName] !== null && dbEntity[relation.propertyName] !== undefined)
            .reduce((operations, relation) => {
                const relationMetadata = relation.inverseEntityMetadata;
                const relationIdProperty = relationMetadata.firstPrimaryColumn.propertyName; // todo: this should be got from join table metadata, not primaryColumn
                const value = newEntity ? this.getEntityRelationValue(relation, newEntity.entity) : null;
                const dbValue = this.getEntityRelationValue(relation, dbEntity);

                if (dbValue instanceof Array) {
                    dbValue.forEach((subEntity: any) => {
                        if (!subEntity)
                            return;

                        if (relation.isManyToMany) {
                            const has = !value || !value.find((e: any) => e[relationIdProperty] === subEntity[relationIdProperty]);

                            if (has) {
                                operations.push({
                                    metadata: relation.junctionEntityMetadata,
                                    entity1: dbEntity,
                                    entity2: subEntity,
                                    entity1Target: dbEntityWithId.entityTarget,
                                    entity2Target: relationMetadata.target
                                });
                            }
                        }

                        if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) { // todo: its a remove operation, why updates are used here?
                            const subEntityWithId = new OperateEntity(relationMetadata, subEntity);
                            const subOperations = this.findJunctionRemoveOperations(relationMetadata, subEntityWithId, newEntities, false);
                            subOperations.forEach(o => operations.push(o));
                        }
                    });
                } else if (dbValue) { // todo: not sure about this check?
                    if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) { // todo: its a remove operation, why updates are used here?
                        const dbValueWithId = new OperateEntity(relationMetadata, dbValue);
                        const subOperations = this.findJunctionRemoveOperations(relationMetadata, dbValueWithId, newEntities, false);
                        subOperations.forEach(o => operations.push(o));
                    }
                }

                return operations;
            }, <JunctionRemoveOperation[]> []);
    }

    private diffColumns(metadata: EntityMetadata, newEntity: any, dbEntity: any) {

        // console.log("differenting columns: newEntity: ", newEntity);
        // console.log("differenting columns: dbEntity: ", dbEntity);

        return metadata.allColumns.filter(column => {
            if (column.isVirtual ||
                column.isParentId ||
                column.isDiscriminator ||
                column.isUpdateDate ||
                column.isVersion ||
                column.isCreateDate ||
                column.getEntityValue(newEntity) === column.getEntityValue(dbEntity))
                return false;

            // filter out "relational columns" only in the case if there is a relation object in entity
            if (!column.isInEmbedded && metadata.hasRelationWithDbName(column.propertyName)) {
                const relation = metadata.findRelationWithDbName(column.propertyName);
                if (newEntity[relation.propertyName] !== null && newEntity[relation.propertyName] !== undefined)
                    return false;
            }
            return true;
        });
    }

    private diffRelations(updatesByRelations: UpdateByRelationOperation[], metadata: EntityMetadata, newEntity: any, dbEntity: any) {
        return metadata.allRelations.filter(relation => {
            if (!relation.isManyToOne && !(relation.isOneToOne && relation.isOwning))
                return false;

            // try to find if there is update by relation operation - we dont need to generate update relation operation for this
            if (updatesByRelations.find(operation => operation.targetEntity === newEntity && operation.updatedRelation === relation))
                return false;

            if (!newEntity[relation.propertyName] && !dbEntity[relation.propertyName])
                return false;
            if (!newEntity[relation.propertyName] || !dbEntity[relation.propertyName])
                return true;

            const relatedMetadata = this.entityMetadatas.findByTarget(relation.entityMetadata.target);
            return !relatedMetadata.compareEntities(newEntity[relation.propertyName], dbEntity[relation.propertyName]);
        });
    }

    private findEntityWithId(entityWithIds: OperateEntity[], entityTarget: Function|string|undefined, id: ObjectLiteral) {
        return entityWithIds.find(entityWithId => entityWithId.compareId(id) && entityWithId.entityTarget === entityTarget);
    }

    private checkCascadesAllowed(type: "insert"|"update"|"remove", metadata: EntityMetadata, relation: RelationMetadata) {
        let isAllowed = false;
        switch (type) {
            case "insert":
                isAllowed = relation.isCascadeInsert;
                break;
            case "update":
                isAllowed = relation.isCascadeUpdate;
                break;
            case "remove":
                isAllowed = relation.isCascadeRemove;
                break;
        }

        if (isAllowed === false && this.strictCascadesMode)
            throw new CascadesNotAllowedError(type, metadata, relation);

        return isAllowed;
    }
    
    private getEntityRelationValue(relation: RelationMetadata, entity: any) {
        return relation.isLazy ? entity["__" + relation.propertyName + "__"] : entity[relation.propertyName];
    }

}