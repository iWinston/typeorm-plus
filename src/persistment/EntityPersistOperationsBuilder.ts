import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {RelationMetadata} from "../metadata-builder/metadata/RelationMetadata";
import {Connection} from "../connection/Connection";
import {PersistOperation, EntityWithId} from "./operation/PersistOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {CascadesNotAllowedError} from "./error/CascadesNotAllowedError";
import {RemoveOperation} from "./operation/RemoveOperation";

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

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    buildFullPersistment(metadata: EntityMetadata, dbEntity: any, persistedEntity: any): PersistOperation {
        const dbEntities = this.extractObjectsById(dbEntity, metadata);
        const allPersistedEntities = this.extractObjectsById(persistedEntity, metadata);
        
        const persistOperation = new PersistOperation();
        persistOperation.dbEntity = dbEntity;
        persistOperation.persistedEntity = persistedEntity;
        persistOperation.allDbEntities = dbEntities;
        persistOperation.allPersistedEntities = allPersistedEntities;
        persistOperation.inserts = this.findCascadeInsertedEntities(persistedEntity, dbEntities, null);
        persistOperation.updates = this.findCascadeUpdateEntities(metadata, dbEntity, persistedEntity, null);
        persistOperation.junctionInserts = this.findJunctionInsertOperations(metadata, persistedEntity, dbEntities);
        persistOperation.updatesByRelations = this.updateRelations(persistOperation.inserts, persistedEntity);
        persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allPersistedEntities, null, null, null);
        persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allPersistedEntities);

        return persistOperation;
    }
    
    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    buildOnlyRemovement(metadata: EntityMetadata, dbEntity: any, newEntity: any): PersistOperation {
        const dbEntities = this.extractObjectsById(dbEntity, metadata);
        const allEntities = this.extractObjectsById(newEntity, metadata);
        
        const persistOperation = new PersistOperation();
        persistOperation.dbEntity = dbEntity;
        persistOperation.persistedEntity = newEntity;
        persistOperation.allDbEntities = dbEntities;
        persistOperation.allPersistedEntities = allEntities;
        persistOperation.removes = this.findCascadeRemovedEntities(metadata, dbEntity, allEntities, null, null, null);
        persistOperation.junctionRemoves = this.findJunctionRemoveOperations(metadata, dbEntity, allEntities);

        return persistOperation;
    }
    
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    
    private findCascadeInsertedEntities(newEntity: any, 
                                        dbEntities: EntityWithId[], 
                                        fromRelation: RelationMetadata): InsertOperation[] {

        let operations: InsertOperation[] = [];
        const metadata = this.connection.getMetadata(newEntity.constructor);
        const isObjectNew = !this.findEntityWithId(dbEntities, metadata.target, newEntity[metadata.primaryColumn.name]);
        
        // if object is new and should be inserted, we check if cascades are allowed before add it to operations list
        if (isObjectNew && !this.checkCascadesAllowed("insert", metadata, fromRelation)) {
            return operations; // looks like object is new here, but cascades are not allowed - then we should stop iteration

        } else if (isObjectNew) { // object is new and cascades are allow here
            operations.push(new InsertOperation(newEntity));
        }

        metadata.relations
            .filter(relation => !!newEntity[relation.propertyName])
            .forEach(relation => {
                const value = newEntity[relation.propertyName];
                if (value instanceof Array) {
                    value.forEach((subEntity: any) => {
                        const subInserted = this.findCascadeInsertedEntities(subEntity, dbEntities, relation);
                        operations = operations.concat(subInserted);
                    });
                } else {
                    const subInserted = this.findCascadeInsertedEntities(value, dbEntities, relation);
                    operations = operations.concat(subInserted);
                }
            });
        
        return operations;
    }

    private findCascadeUpdateEntities(metadata: EntityMetadata,
                                      dbEntity: any,
                                      newEntity: any,
                                      fromRelation: RelationMetadata): UpdateOperation[] {
        let operations: UpdateOperation[] = [];
        if (!dbEntity)
            return operations;

        const diff = this.diffColumns(metadata, newEntity, dbEntity);
        if (diff.length && !this.checkCascadesAllowed("update", metadata, fromRelation)) {
            return operations;
            
        } else if (diff.length) {
            const entityId = newEntity[metadata.primaryColumn.name];
            operations.push(new UpdateOperation(newEntity, entityId, diff));
        }

        metadata.relations
            .filter(relation => newEntity[relation.propertyName] && dbEntity[relation.propertyName])
            .forEach(relation => {
                const relMetadata = relation.relatedEntityMetadata;
                const relationIdColumnName = relMetadata.primaryColumn.name;
                const value = newEntity[relation.propertyName];
                const dbValue = dbEntity[relation.propertyName];
                
                if (value instanceof Array) {
                    value.forEach((subEntity: any) => {
                        const subDbEntity = dbValue.find((subDbEntity: any) => {
                            return subDbEntity[relationIdColumnName] === subEntity[relationIdColumnName];
                        });
                        const relationOperations = this.findCascadeUpdateEntities(relMetadata, subDbEntity, subEntity, relation);
                        operations = operations.concat(relationOperations);
                    });
                } else {
                    const relationOperations = this.findCascadeUpdateEntities(relMetadata, dbValue, newEntity[relation.propertyName], relation);
                    operations = operations.concat(relationOperations);
                }
            });
        
        return operations;
    }

    private findCascadeRemovedEntities(metadata: EntityMetadata,
                                       dbEntity: any,
                                       allPersistedEntities: EntityWithId[],
                                       fromRelation: RelationMetadata,
                                       fromMetadata: EntityMetadata,
                                       fromEntityId: any,
                                       parentAlreadyRemoved: boolean = false): RemoveOperation[] {
        let operations: RemoveOperation[] = [];
        if (!dbEntity)
            return operations;

        const relationId = dbEntity[metadata.primaryColumn.name];
        const isObjectRemoved = parentAlreadyRemoved || !this.findEntityWithId(allPersistedEntities, metadata.target, relationId);

        // if object is removed and should be removed, we check if cascades are allowed before add it to operations list
        if (isObjectRemoved && !this.checkCascadesAllowed("remove", metadata, fromRelation)) {
            return operations; // looks like object is removed here, but cascades are not allowed - then we should stop iteration

        } else if (isObjectRemoved) {  // object is remove and cascades are allow here
            operations.push(new RemoveOperation(dbEntity, relationId, fromMetadata, fromRelation, fromEntityId));
        }

        metadata.relations
            .filter(relation => !!dbEntity[relation.propertyName])
            .forEach(relation => {
                const dbValue = dbEntity[relation.propertyName];
                const relMetadata = relation.relatedEntityMetadata;
                if (dbValue instanceof Array) {
                    dbValue.forEach((subDbEntity: any) => {
                        const relationOperations = this.findCascadeRemovedEntities(relMetadata, subDbEntity, allPersistedEntities, relation, metadata, dbEntity[metadata.primaryColumn.name], isObjectRemoved);
                        operations = operations.concat(relationOperations);
                    });
                } else {
                    const relationOperations = this.findCascadeRemovedEntities(relMetadata, dbValue, allPersistedEntities, relation, metadata, dbEntity[metadata.primaryColumn.name], isObjectRemoved);
                    operations = operations.concat(relationOperations);
                }
            }, []);

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

    private findRelationsWithEntityInside(insertOperation: InsertOperation, entityToSearchIn: any) {
        const metadata = this.connection.getMetadata(entityToSearchIn.constructor);

        return metadata.relations.reduce((operations, relation) => {
            const value = entityToSearchIn[relation.propertyName];
            if (value instanceof Array) {
                value.forEach((sub: any) => {
                    if (!relation.isManyToMany && sub === insertOperation.entity)
                        operations.push(new UpdateByRelationOperation(entityToSearchIn, insertOperation, relation));

                    const subOperations = this.findRelationsWithEntityInside(insertOperation, sub);
                    operations.concat(subOperations);
                });
            } else if (value) {
                if (value === insertOperation.entity) {
                    operations.push(new UpdateByRelationOperation(entityToSearchIn, insertOperation, relation));
                }

                const subOperations = this.findRelationsWithEntityInside(insertOperation, value);
                operations.concat(subOperations);
            }

            return operations;
        }, <UpdateByRelationOperation[]> []);
    }
    
    private findJunctionInsertOperations(metadata: EntityMetadata, newEntity: any, dbEntities: EntityWithId[]): JunctionInsertOperation[] {
        const dbEntity = dbEntities.find(dbEntity => {
            return dbEntity.id === newEntity[metadata.primaryColumn.name] && dbEntity.entity.constructor === metadata.target;
        });
        return metadata.relations
            .filter(relation => relation.isManyToMany)
            .filter(relation => newEntity[relation.propertyName] instanceof Array)
            .reduce((operations, relation) => {
                const relationMetadata = relation.relatedEntityMetadata;
                const relationIdProperty = relationMetadata.primaryColumn.name;
                newEntity[relation.propertyName].map((subEntity: any) => {

                    const has = !dbEntity ||
                                !dbEntity.entity[relation.propertyName] ||
                                !dbEntity.entity[relation.propertyName].find((e: any) => e[relationIdProperty] === subEntity[relationIdProperty]);

                    if (has) {
                        operations.push({
                            metadata: relation.junctionEntityMetadata,
                            entity1: newEntity,
                            entity2: subEntity
                        });
                    }

                    const subOperations = this.findJunctionInsertOperations(relationMetadata, subEntity, dbEntities);
                    operations = operations.concat(subOperations);
                });
                return operations;
            }, <JunctionInsertOperation[]> []);
    }
    
    private findJunctionRemoveOperations(metadata: EntityMetadata, dbEntity: any, newEntities: EntityWithId[]): JunctionInsertOperation[] {
        if (!dbEntity) // if new entity is persisted then it does not have anything to be deleted
            return [];
        
        const newEntity = newEntities.find(newEntity => {
            return newEntity.id === dbEntity[metadata.primaryColumn.name] && newEntity.entity.constructor === metadata.target;
        });
        return metadata.relations
            .filter(relation => relation.isManyToMany)
            .filter(relation => dbEntity[relation.propertyName] instanceof Array)
            .reduce((operations, relation) => {
                const relationMetadata = relation.relatedEntityMetadata;
                const relationIdProperty = relationMetadata.primaryColumn.name;
                dbEntity[relation.propertyName].map((subEntity: any) => {

                    const has = !newEntity ||
                                !newEntity.entity[relation.propertyName] ||
                                !newEntity.entity[relation.propertyName].find((e: any) => e[relationIdProperty] === subEntity[relationIdProperty]);

                    if (has) {
                        operations.push({
                            metadata: relation.junctionEntityMetadata,
                            entity1: dbEntity,
                            entity2: subEntity
                        });
                    }

                    const subOperations = this.findJunctionRemoveOperations(relationMetadata, subEntity, newEntities);
                    operations = operations.concat(subOperations);
                });
                return operations;
            }, <JunctionInsertOperation[]> []);
    }

    /**
     * Extracts unique objects from given entity and all its downside relations.
     */
    private extractObjectsById(entity: any, metadata: EntityMetadata): EntityWithId[] {
        if (!entity)
            return [];
        
        return metadata.relations
            .filter(relation => !!entity[relation.propertyName])
            .map(relation => {
                const relMetadata = relation.relatedEntityMetadata;
                if (!(entity[relation.propertyName] instanceof Array))
                    return this.extractObjectsById(entity[relation.propertyName], relMetadata);
                
                return entity[relation.propertyName]
                    .map((subEntity: any) => this.extractObjectsById(subEntity, relMetadata))
                    .reduce((col1: any[], col2: any[]) => col1.concat(col2), []); // flatten
            })
            .reduce((col1: any[], col2: any[]) => col1.concat(col2), [])  // flatten
            .concat([{
                id: entity[metadata.primaryColumn.name],
                entity: entity
            }])
            .filter((entity: any, index: number, allEntities: any[]) => allEntities.indexOf(entity) === index); // unique
    }

    private diffColumns(metadata: EntityMetadata, newEntity: any, dbEntity: any) {
        return metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => newEntity[column.propertyName] !== dbEntity[column.propertyName]);
    }

    private findEntityWithId(entityWithIds: EntityWithId[], entityClass: Function, id: any) {
        return entityWithIds.find(entityWithId => entityWithId.id === id && entityWithId.entity.constructor === entityClass);
    }

    private checkCascadesAllowed(type: "insert"|"update"|"remove", metadata: EntityMetadata, relation: RelationMetadata) {
        if (!relation)
            return true;

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

}