import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {PersistOperation, EntityWithId} from "./operation/PersistOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {CascadesNotAllowedError} from "./error/CascadesNotAllowedError";
import {RemoveOperation} from "./operation/RemoveOperation";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {UpdateByInverseSideOperation} from "./operation/UpdateByInverseSideOperation";
import {JunctionRemoveOperation} from "./operation/JunctionRemoveOperation";

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
    buildFullPersistment(metadata: EntityMetadata, 
                         dbEntity: EntityWithId, 
                         persistedEntity: EntityWithId, 
                         dbEntities: EntityWithId[],
                         allPersistedEntities: EntityWithId[]): PersistOperation {
        
        // const dbEntities = this.extractObjectsById(dbEntity, metadata);
        // const allPersistedEntities = this.extractObjectsById(persistedEntity, metadata);

        const persistOperation = new PersistOperation();
        persistOperation.dbEntity = dbEntity;
        persistOperation.persistedEntity = persistedEntity;
        persistOperation.allDbEntities = dbEntities;
        persistOperation.allPersistedEntities = allPersistedEntities;
        persistOperation.inserts = this.findCascadeInsertedEntities(persistedEntity, dbEntities);
        persistOperation.updatesByRelations = this.updateRelations(persistOperation.inserts, persistedEntity);
        persistOperation.updatesByInverseRelations = this.updateInverseRelations(metadata, dbEntity, persistedEntity);
        persistOperation.updates = this.findCascadeUpdateEntities(persistOperation.updatesByRelations, metadata, dbEntity, persistedEntity, dbEntities);
        persistOperation.junctionInserts = this.findJunctionInsertOperations(metadata, persistedEntity, dbEntities);
        persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allPersistedEntities, undefined, undefined, undefined);
        persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allPersistedEntities);

        // persistOperation.log();

        return persistOperation;
    }

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    buildOnlyRemovement(metadata: EntityMetadata,
                        dbEntity: EntityWithId,
                        persistedEntity: EntityWithId,
                        dbEntities: EntityWithId[],
                        allPersistedEntities: EntityWithId[]): PersistOperation {
        // const dbEntities = this.extractObjectsById(dbEntity, metadata);
        // const allEntities = this.extractObjectsById(newEntity, metadata);

        const persistOperation = new PersistOperation();
        persistOperation.dbEntity = dbEntity;
        persistOperation.persistedEntity = persistedEntity;
        persistOperation.allDbEntities = dbEntities;
        persistOperation.allPersistedEntities = allPersistedEntities;
        persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allPersistedEntities, undefined, undefined, undefined);
        persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allPersistedEntities);

        return persistOperation;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private findCascadeInsertedEntities(newEntityWithId: EntityWithId,
                                        dbEntities: EntityWithId[],
                                        fromRelation?: RelationMetadata,
                                        operations: InsertOperation[] = []): InsertOperation[] {
        const newEntity = newEntityWithId.entity;
        const metadata = this.entityMetadatas.findByTarget(newEntityWithId.entityTarget);
        const isObjectNew = !this.findEntityWithId(dbEntities, metadata.target, newEntity[metadata.primaryColumn.propertyName]);

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
                    const subValueWithId: EntityWithId = {
                        id: inverseMetadata.getEntityId(subValue),
                        entity: subValue,
                        entityTarget: inverseMetadata.target
                    };
                    this.findCascadeInsertedEntities(subValueWithId, dbEntities, relation, operations);
                });
            } else {
                const valueWithId: EntityWithId = {
                    id: inverseMetadata.getEntityId(value),
                    entity: value,
                    entityTarget: inverseMetadata.target
                };
                this.findCascadeInsertedEntities(valueWithId, dbEntities, relation, operations);
            }
        });

        return operations;
    }

    private findCascadeUpdateEntities(updatesByRelations: UpdateByRelationOperation[],
                                      metadata: EntityMetadata,
                                      dbEntityWithId: EntityWithId,
                                      newEntityWithId: EntityWithId,
                                      dbEntities: EntityWithId[],
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
            const entityId = newEntity[metadata.primaryColumn.propertyName];
            if (entityId)
                operations.push(new UpdateOperation(newEntityWithId.entityTarget, newEntity, entityId, diffColumns, diffRelations));
        }

        metadata.relations.forEach(relation => {
            const relMetadata = relation.inverseEntityMetadata;
            const relationIdColumnName = relMetadata.primaryColumn.propertyName;
            const value = this.getEntityRelationValue(relation, newEntity);
            const valueTarget = relation.target;
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
                        return dbValue.entityTarget === valueTarget && dbValue.entity[referencedColumnName] === subEntity[relationIdColumnName];
                    });
                    if (dbValue) {
                        const dbValueWithId: EntityWithId = {
                            id: relMetadata.getEntityId(dbValue.entity),
                            entity: dbValue.entity,
                            entityTarget: relMetadata.target
                        };
                        const subEntityWithId: EntityWithId = {
                            id: relMetadata.getEntityId(subEntity),
                            entity: subEntity,
                            entityTarget: relMetadata.target
                        };
                        this.findCascadeUpdateEntities(updatesByRelations, relMetadata, dbValueWithId, subEntityWithId, dbEntities, relation, operations);
                    }
                });
                
            } else {
                const dbValue = dbEntities.find(dbValue => {
                    return dbValue.entityTarget === valueTarget && dbValue.entity[referencedColumnName] === value[relationIdColumnName];
                });
                if (dbValue) {

                    const dbValueWithId: EntityWithId = {
                        id: relMetadata.getEntityId(dbValue.entity),
                        entity: dbValue.entity,
                        entityTarget: relMetadata.target
                    };
                    const valueWithId: EntityWithId = {
                        id: relMetadata.getEntityId(value),
                        entity: value,
                        entityTarget: relMetadata.target
                    };
                    
                    this.findCascadeUpdateEntities(updatesByRelations, relMetadata, dbValueWithId, valueWithId, dbEntities, relation, operations);
                }
            }
        });

        return operations;
    }

    private findCascadeRemovedEntities(metadata: EntityMetadata,
                                       dbEntityWithId: EntityWithId,
                                       allPersistedEntities: EntityWithId[],
                                       fromRelation: RelationMetadata|undefined,
                                       fromMetadata: EntityMetadata|undefined,
                                       fromEntityId: any,
                                       parentAlreadyRemoved: boolean = false): RemoveOperation[] {
        const dbEntity = dbEntityWithId.entity;
        
        let operations: RemoveOperation[] = [];
        if (!dbEntity)
            return operations;

        const entityId = dbEntity[metadata.primaryColumn.propertyName];
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
                    const subDbEntityWithId: EntityWithId = {
                        id: relMetadata.getEntityId(subDbEntity),
                        entity: subDbEntity,
                        entityTarget: relMetadata.target
                    };
                    
                    const relationOperations = this.findCascadeRemovedEntities(relMetadata, subDbEntityWithId, allPersistedEntities, relation, metadata, dbEntity[metadata.primaryColumn.propertyName], isObjectRemoved);
                    relationOperations.forEach(o => operations.push(o));
                });
            } else {
                const dbValueWithId: EntityWithId = {
                    id: relMetadata.getEntityId(dbValue),
                    entity: dbValue,
                    entityTarget: relMetadata.target
                };
                
                const relationOperations = this.findCascadeRemovedEntities(relMetadata, dbValueWithId, allPersistedEntities, relation, metadata, dbEntity[metadata.primaryColumn.propertyName], isObjectRemoved);
                relationOperations.forEach(o => operations.push(o));
            }
        }, []);

        return operations;
    }

    private updateInverseRelations(metadata: EntityMetadata,
                                   dbEntityWithId: EntityWithId,
                                   newEntityWithId: EntityWithId,
                                   operations: UpdateByInverseSideOperation[] = []): UpdateByInverseSideOperation[] {
        const dbEntity = dbEntityWithId.entity;
        const newEntity = newEntityWithId.entity;
        metadata.relations
            .filter(relation => relation.isOneToMany) // todo: maybe need to check isOneToOne and not owner
            // .filter(relation => newEntity[relation.propertyName] instanceof Array) // todo: what to do with empty relations? need to set to NULL from inverse side?
            .forEach(relation => {
                const relationMetadata = relation.inverseEntityMetadata;
                
                // to find new objects in relation go throw all objects in newEntity and check if they don't exist in dbEntity
                if (newEntity && newEntity[relation.propertyName] instanceof Array) {
                    newEntity[relation.propertyName].filter((newSubEntity: any) => {
                        if (!dbEntity /* are you sure about this? */ || !dbEntity[relation.propertyName]) // if there are no items in dbEntity - then all items in newEntity are new
                            return true;

                        return !dbEntity[relation.propertyName].find((dbSubEntity: any) => {
                            return relation.inverseEntityMetadata.getEntityId(newSubEntity) === relation.inverseEntityMetadata.getEntityId(dbSubEntity);
                        });
                    }).forEach((subEntity: any) => {
                        operations.push(new UpdateByInverseSideOperation(relationMetadata.target, newEntityWithId.entityTarget, "update", subEntity, newEntity, relation));
                    });
                }
                
                // we also need to find removed elements. to find them need to traverse dbEntity and find its elements missing in newEntity
                if (dbEntity && dbEntity[relation.propertyName] instanceof Array) {
                    dbEntity[relation.propertyName].filter((dbSubEntity: any) => {
                        if (!newEntity /* are you sure about this? */ || !newEntity[relation.propertyName]) // if there are no items in newEntity - then all items in dbEntity are removed
                            return true;

                        return !newEntity[relation.propertyName].find((newSubEntity: any) => {
                            return relation.inverseEntityMetadata.getEntityId(dbSubEntity) === relation.inverseEntityMetadata.getEntityId(newSubEntity);
                        });
                    }).forEach((subEntity: any) => {
                        operations.push(new UpdateByInverseSideOperation(relationMetadata.target, newEntityWithId.entityTarget, "remove", subEntity, newEntity, relation));
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

    private updateRelations(insertOperations: InsertOperation[], newEntity: EntityWithId): UpdateByRelationOperation[] {
        return insertOperations.reduce((operations, insertOperation) => {
            return operations.concat(this.findRelationsWithEntityInside(insertOperation, newEntity));
        }, <UpdateByRelationOperation[]> []);
    }

    private findRelationsWithEntityInside(insertOperation: InsertOperation, entityToSearchInWithId: EntityWithId): UpdateByRelationOperation[] {
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

                    const subWithId: EntityWithId = {
                        id: inverseMetadata.getEntityId(sub),
                        entity: sub,
                        entityTarget: inverseMetadata.target
                    };
                    const subOperations = this.findRelationsWithEntityInside(insertOperation, subWithId);
                    subOperations.forEach(o => operations.push(o));
                });

            } else if (value) {

                if (value === insertOperation.entity) {
                    operations.push(new UpdateByRelationOperation(entityToSearchInWithId.entityTarget, entityToSearchIn, insertOperation, relation));
                }

                const valueWithId: EntityWithId = {
                    id: inverseMetadata.getEntityId(value),
                    entity: value,
                    entityTarget: inverseMetadata.target
                };
                const subOperations = this.findRelationsWithEntityInside(insertOperation, valueWithId);
                subOperations.forEach(o => operations.push(o));

            }
        });
        
        return operations;
    }

    private findJunctionInsertOperations(metadata: EntityMetadata, newEntityWithId: EntityWithId, dbEntities: EntityWithId[], isRoot = true): JunctionInsertOperation[] {
        const newEntity = newEntityWithId.entity;
        const dbEntity = dbEntities.find(dbEntity => {
            return dbEntity.id === newEntity[metadata.primaryColumn.propertyName] && dbEntity.entityTarget === metadata.target;
        });
        return metadata.relations.reduce((operations, relation) => {
            const relationMetadata = relation.inverseEntityMetadata;
            const relationIdProperty = relationMetadata.primaryColumn.propertyName;
            const value = this.getEntityRelationValue(relation, newEntity);
            if (value === null || value === undefined)
                return operations;

            const dbValue = dbEntity ? this.getEntityRelationValue(relation, dbEntity.entity) : null;

            if (value instanceof Array) {
                value.forEach((subEntity: any) => {

                    if (relation.isManyToMany) {
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
                        const subEntityWithId: EntityWithId = {
                            id: relationMetadata.getEntityId(subEntity),
                            entity: subEntity,
                            entityTarget: relationMetadata.target
                        };
                        const subOperations = this.findJunctionInsertOperations(relationMetadata, subEntityWithId, dbEntities, false);
                        subOperations.forEach(o => operations.push(o));
                    }
                });
            } else {
                if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                    const valueWithId: EntityWithId = {
                        id: relationMetadata.getEntityId(value),
                        entity: value,
                        entityTarget: relationMetadata.target
                    };
                    const subOperations = this.findJunctionInsertOperations(relationMetadata, valueWithId, dbEntities, false);
                    subOperations.forEach(o => operations.push(o));
                }
            }

            return operations;
        }, <JunctionInsertOperation[]> []);
    }

    private findJunctionRemoveOperations(metadata: EntityMetadata, dbEntityWithId: EntityWithId, newEntities: EntityWithId[], isRoot = true): JunctionInsertOperation[] {
        const dbEntity = dbEntityWithId.entity;
        if (!dbEntity) // if new entity is persisted then it does not have anything to be deleted
            return [];

        const newEntity = newEntities.find(newEntity => {
            return newEntity.id === dbEntity[metadata.primaryColumn.propertyName] && newEntity.entityTarget === metadata.target;
        });
        return metadata.relations
            .filter(relation => dbEntity[relation.propertyName] !== null && dbEntity[relation.propertyName] !== undefined)
            .reduce((operations, relation) => {
                const relationMetadata = relation.inverseEntityMetadata;
                const relationIdProperty = relationMetadata.primaryColumn.propertyName;
                const value = newEntity ? this.getEntityRelationValue(relation, newEntity.entity) : null;
                const dbValue = this.getEntityRelationValue(relation, dbEntity);

                if (dbValue instanceof Array) {
                    dbValue.forEach((subEntity: any) => {

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

                        if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                            const subEntityWithId: EntityWithId = {
                                id: relationMetadata.getEntityId(subEntity),
                                entity: subEntity,
                                entityTarget: relationMetadata.target
                            };
                            
                            const subOperations = this.findJunctionRemoveOperations(relationMetadata, subEntityWithId, newEntities, false);
                            subOperations.forEach(o => operations.push(o));
                        }
                    });
                } else {
                    if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                        const dbValueWithId: EntityWithId = {
                            id: relationMetadata.getEntityId(dbValue),
                            entity: dbValue,
                            entityTarget: relationMetadata.target
                        };
                        
                        const subOperations = this.findJunctionRemoveOperations(relationMetadata, dbValueWithId, newEntities, false);
                        subOperations.forEach(o => operations.push(o));
                    }
                }

                return operations;
            }, <JunctionRemoveOperation[]> []);
    }

    private diffColumns(metadata: EntityMetadata, newEntity: any, dbEntity: any) {
        return metadata.columns
            .filter(column => !column.isVirtual && !column.isUpdateDate && !column.isVersion && !column.isCreateDate)
            .filter(column => column.getEntityValue(newEntity) !== column.getEntityValue(dbEntity))
            .filter(column => {
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
        return metadata.relations
            .filter(relation => relation.isManyToOne || (relation.isOneToOne && relation.isOwning))
            .filter(relation => !updatesByRelations.find(operation => operation.targetEntity === newEntity && operation.updatedRelation === relation)) // try to find if there is update by relation operation - we dont need to generate update relation operation for this
            .filter(relation => {
                if (!newEntity[relation.propertyName] && !dbEntity[relation.propertyName])
                    return false;
                if (!newEntity[relation.propertyName] || !dbEntity[relation.propertyName])
                    return true;
                const entityTarget = relation.target;
                
                const newEntityRelationMetadata = this.entityMetadatas.findByTarget(entityTarget);
                const dbEntityRelationMetadata = this.entityMetadatas.findByTarget(entityTarget);
                return newEntityRelationMetadata.getEntityId(newEntity[relation.propertyName]) !== dbEntityRelationMetadata.getEntityId(dbEntity[relation.propertyName]);
            });
    }

    private findEntityWithId(entityWithIds: EntityWithId[], entityTarget: Function|string, id: any) {
        return entityWithIds.find(entityWithId => entityWithId.id === id && entityWithId.entityTarget === entityTarget);
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