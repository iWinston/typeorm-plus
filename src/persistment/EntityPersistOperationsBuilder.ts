import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {PersistOperation, EntityWithId} from "./operation/PersistOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {CascadesNotAllowedError} from "./error/CascadesNotAllowedError";
import {RemoveOperation} from "./operation/RemoveOperation";
import {EntityMetadataCollection} from "../metadata/collection/EntityMetadataCollection";
import {UpdateByInverseSideOperation} from "./operation/UpdateByInverseSideOperation";

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
 * @internal
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
                         dbEntity: any, 
                         persistedEntity: any, 
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
        persistOperation.updates = this.findCascadeUpdateEntities(persistOperation.updatesByRelations, metadata, dbEntity, persistedEntity);
        persistOperation.junctionInserts = this.findJunctionInsertOperations(metadata, persistedEntity, dbEntities);
        persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allPersistedEntities, undefined, undefined, undefined);
        persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allPersistedEntities);

        return persistOperation;
    }

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    buildOnlyRemovement(metadata: EntityMetadata,
                        dbEntity: any,
                        persistedEntity: any,
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

    private findCascadeInsertedEntities(newEntity: any,
                                        dbEntities: EntityWithId[],
                                        fromRelation?: RelationMetadata,
                                        operations: InsertOperation[] = []): InsertOperation[] {
        // const metadata = this.connection.getEntityMetadata(newEntity.constructor);
        const metadata = this.entityMetadatas.findByTarget(newEntity.constructor);
        const isObjectNew = !this.findEntityWithId(dbEntities, metadata.target, newEntity[metadata.primaryColumn.name]);

        // if object is new and should be inserted, we check if cascades are allowed before add it to operations list
        if (isObjectNew && fromRelation && !this.checkCascadesAllowed("insert", metadata, fromRelation)) {
            return operations; // looks like object is new here, but cascades are not allowed - then we should stop iteration

        } else if (isObjectNew && !operations.find(o => o.entity === newEntity)) { // object is new and cascades are allow here
            operations.push(new InsertOperation(newEntity));
        }

        metadata.relations.forEach(relation => {
            const value = this.getEntityRelationValue(relation, newEntity);
            if (!value) return;

            if (value instanceof Array) {
                value.map((subValue: any) => this.findCascadeInsertedEntities(subValue, dbEntities, relation, operations));
            } else {
                this.findCascadeInsertedEntities(value, dbEntities, relation, operations);
            }
        });

        return operations;
    }

    private findCascadeUpdateEntities(updatesByRelations: UpdateByRelationOperation[],
                                      metadata: EntityMetadata,
                                      dbEntity: any,
                                      newEntity: any,
                                      fromRelation?: RelationMetadata,
                                      operations: UpdateOperation[] = []): UpdateOperation[] {
        if (!dbEntity)
            return operations;

        const diffColumns = this.diffColumns(metadata, newEntity, dbEntity);
        const diffRelations = this.diffRelations(updatesByRelations, metadata, newEntity, dbEntity);
        if (diffColumns.length && fromRelation && !this.checkCascadesAllowed("update", metadata, fromRelation)) {
            return operations;

        } else if (diffColumns.length || diffRelations.length) {
            const entityId = newEntity[metadata.primaryColumn.name];
            if (entityId)
                operations.push(new UpdateOperation(newEntity, entityId, diffColumns, diffRelations));
        }

        metadata.relations.forEach(relation => {
            const relMetadata = relation.inverseEntityMetadata;
            const relationIdColumnName = relMetadata.primaryColumn.name;
            const value = this.getEntityRelationValue(relation, newEntity);
            const dbValue = this.getEntityRelationValue(relation, dbEntity);

            if (!value || !dbValue)
                return;

            if (value instanceof Array) {
                value.forEach((subEntity: any) => {
                    const subDbEntity = dbValue.find((subDbEntity: any) => {
                        return subDbEntity[relationIdColumnName] === subEntity[relationIdColumnName];
                    });
                    this.findCascadeUpdateEntities(updatesByRelations, relMetadata, subDbEntity, subEntity, relation, operations);
                });
                
            } else {
                this.findCascadeUpdateEntities(updatesByRelations, relMetadata, dbValue, value, relation, operations);
            }
        });

        return operations;
    }

    private findCascadeRemovedEntities(metadata: EntityMetadata,
                                       dbEntity: any,
                                       allPersistedEntities: EntityWithId[],
                                       fromRelation: RelationMetadata|undefined,
                                       fromMetadata: EntityMetadata|undefined,
                                       fromEntityId: any,
                                       parentAlreadyRemoved: boolean = false): RemoveOperation[] {
        let operations: RemoveOperation[] = [];
        if (!dbEntity)
            return operations;

        const entityId = dbEntity[metadata.primaryColumn.name];
        const isObjectRemoved = parentAlreadyRemoved || !this.findEntityWithId(allPersistedEntities, metadata.target, entityId);

        // if object is removed and should be removed, we check if cascades are allowed before add it to operations list
        if (isObjectRemoved && fromRelation && !this.checkCascadesAllowed("remove", metadata, fromRelation)) {
            return operations; // looks like object is removed here, but cascades are not allowed - then we should stop iteration

        } else if (isObjectRemoved) {  // object is remove and cascades are allow here
            operations.push(new RemoveOperation(dbEntity, entityId, <EntityMetadata> fromMetadata, fromRelation, fromEntityId));
        }

        metadata.relations.forEach(relation => {
            const dbValue = this.getEntityRelationValue(relation, dbEntity);
            const relMetadata = relation.inverseEntityMetadata;
            if (!dbValue) return;
            
            if (dbValue instanceof Array) {
                dbValue.forEach((subDbEntity: any) => {
                    const relationOperations = this.findCascadeRemovedEntities(relMetadata, subDbEntity, allPersistedEntities, relation, metadata, dbEntity[metadata.primaryColumn.name], isObjectRemoved);
                    relationOperations.forEach(o => operations.push(o));
                });
            } else {
                const relationOperations = this.findCascadeRemovedEntities(relMetadata, dbValue, allPersistedEntities, relation, metadata, dbEntity[metadata.primaryColumn.name], isObjectRemoved);
                relationOperations.forEach(o => operations.push(o));
            }
        }, []);

        return operations;
    }

    private updateInverseRelations(metadata: EntityMetadata,
                                   dbEntity: any,
                                   newEntity: any,
                                   operations: UpdateByInverseSideOperation[] = []): UpdateByInverseSideOperation[] {
        metadata.relations
            .filter(relation => relation.isOneToMany) // todo: maybe need to check isOneToOne and not owner
            // .filter(relation => newEntity[relation.propertyName] instanceof Array) // todo: what to do with empty relations? need to set to NULL from inverse side?
            .forEach(relation => {
                
                // to find new objects in relation go throw all objects in newEntity and check if they don't exist in dbEntity
                if (newEntity && newEntity[relation.propertyName] instanceof Array) {
                    newEntity[relation.propertyName].filter((newSubEntity: any) => {
                        if (!dbEntity /* are you sure about this? */ || !dbEntity[relation.propertyName]) // if there are no items in dbEntity - then all items in newEntity are new
                            return true;

                        return !dbEntity[relation.propertyName].find((dbSubEntity: any) => {
                            return relation.inverseEntityMetadata.getEntityId(newSubEntity) === relation.inverseEntityMetadata.getEntityId(dbSubEntity);
                        });
                    }).forEach((subEntity: any) => {
                        operations.push(new UpdateByInverseSideOperation("update", subEntity, newEntity, relation));
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
                        operations.push(new UpdateByInverseSideOperation("remove", subEntity, newEntity, relation));
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

    private updateRelations(insertOperations: InsertOperation[], newEntity: any): UpdateByRelationOperation[] {
        return insertOperations.reduce((operations, insertOperation) => {
            return operations.concat(this.findRelationsWithEntityInside(insertOperation, newEntity));
        }, <UpdateByRelationOperation[]> []);
    }

    private findRelationsWithEntityInside(insertOperation: InsertOperation, entityToSearchIn: any): UpdateByRelationOperation[] {
        // updateByt metadata = this.connection.getEntityMetadata(entityToSearchIn.constructor);
        const metadata = this.entityMetadatas.findByTarget(entityToSearchIn.constructor);

        const operations: UpdateByRelationOperation[] = [];
        metadata.relations.forEach(relation => {
            const value = this.getEntityRelationValue(relation, entityToSearchIn);
            if (!value) return;

            if (value instanceof Array) {
                value.forEach((sub: any) => {

                    if (!relation.isManyToMany && sub === insertOperation.entity)
                        operations.push(new UpdateByRelationOperation(entityToSearchIn, insertOperation, relation));

                    const subOperations = this.findRelationsWithEntityInside(insertOperation, sub);
                    subOperations.forEach(o => operations.push(o));
                });

            } else if (value) {

                if (value === insertOperation.entity) {
                    operations.push(new UpdateByRelationOperation(entityToSearchIn, insertOperation, relation));
                }
                const subOperations = this.findRelationsWithEntityInside(insertOperation, value);
                subOperations.forEach(o => operations.push(o));

            }
        });
        
        return operations;
    }

    private findJunctionInsertOperations(metadata: EntityMetadata, newEntity: any, dbEntities: EntityWithId[], isRoot = true): JunctionInsertOperation[] {
        const dbEntity = dbEntities.find(dbEntity => {
            return dbEntity.id === newEntity[metadata.primaryColumn.name] && dbEntity.entity.constructor === metadata.target;
        });
        return metadata.relations
            .filter(relation => newEntity[relation.propertyName] !== null && newEntity[relation.propertyName] !== undefined)
            .reduce((operations, relation) => {
                const relationMetadata = relation.inverseEntityMetadata;
                const relationIdProperty = relationMetadata.primaryColumn.name;
                const value = this.getEntityRelationValue(relation, newEntity);
                const dbValue = dbEntity ? this.getEntityRelationValue(relation, dbEntity.entity) : null;

                if (value instanceof Array) {
                    value.forEach((subEntity: any) => {

                        if (relation.isManyToMany) {
                            const has = !dbValue || !dbValue.find((e: any) => e[relationIdProperty] === subEntity[relationIdProperty]);

                            if (has) {
                                operations.push({
                                    metadata: relation.junctionEntityMetadata,
                                    entity1: newEntity,
                                    entity2: subEntity
                                });
                            }
                        }

                        if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                            const subOperations = this.findJunctionInsertOperations(relationMetadata, subEntity, dbEntities, false);
                            subOperations.forEach(o => operations.push(o));
                        }
                    });
                } else {
                    if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                        const subOperations = this.findJunctionInsertOperations(relationMetadata, value, dbEntities, false);
                        subOperations.forEach(o => operations.push(o));
                    }
                }

                return operations;
            }, <JunctionInsertOperation[]> []);
    }

    private findJunctionRemoveOperations(metadata: EntityMetadata, dbEntity: any, newEntities: EntityWithId[], isRoot = true): JunctionInsertOperation[] {
        if (!dbEntity) // if new entity is persisted then it does not have anything to be deleted
            return [];

        const newEntity = newEntities.find(newEntity => {
            return newEntity.id === dbEntity[metadata.primaryColumn.name] && newEntity.entity.constructor === metadata.target;
        });
        return metadata.relations
            .filter(relation => dbEntity[relation.propertyName] !== null && dbEntity[relation.propertyName] !== undefined)
            .reduce((operations, relation) => {
                const relationMetadata = relation.inverseEntityMetadata;
                const relationIdProperty = relationMetadata.primaryColumn.name;
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
                                    entity2: subEntity
                                });
                            }
                        }

                        if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                            const subOperations = this.findJunctionRemoveOperations(relationMetadata, subEntity, newEntities, false);
                            subOperations.forEach(o => operations.push(o));
                        }
                    });
                } else {
                    if (isRoot || this.checkCascadesAllowed("update", metadata, relation)) {
                        const subOperations = this.findJunctionRemoveOperations(relationMetadata, dbValue, newEntities, false);
                        subOperations.forEach(o => operations.push(o));
                    }
                }

                return operations;
            }, <JunctionInsertOperation[]> []);
    }

    private diffColumns(metadata: EntityMetadata, newEntity: any, dbEntity: any) {
        return metadata.columns
            .filter(column => !column.isVirtual && !column.isUpdateDate && !column.isVersion && !column.isCreateDate)
            .filter(column => newEntity[column.propertyName] !== dbEntity[column.propertyName]);
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
                
                const newEntityRelationMetadata = this.entityMetadatas.findByTarget(newEntity[relation.propertyName].constructor);
                const dbEntityRelationMetadata = this.entityMetadatas.findByTarget(dbEntity[relation.propertyName].constructor);
                return newEntityRelationMetadata.getEntityId(newEntity[relation.propertyName]) !== dbEntityRelationMetadata.getEntityId(dbEntity[relation.propertyName]);
            });
    }

    private findEntityWithId(entityWithIds: EntityWithId[], entityClass: Function, id: any) {
        return entityWithIds.find(entityWithId => entityWithId.id === id && entityWithId.entity.constructor === entityClass);
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
        return (entity[relation.propertyName] instanceof Promise && relation.isLazy) ? entity["__" + relation.propertyName + "__"] : entity[relation.propertyName];
    }

}