import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {RelationMetadata} from "../metadata-builder/metadata/RelationMetadata";
import {Connection} from "../connection/Connection";
import {PersistOperation} from "./operation/PersistOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {UpdateOperation} from "./operation/UpdateOperation";

interface EntityWithId {
    id: any;
    entity: any;
}

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
    difference(metadata: EntityMetadata, entity1: any, entity2: any): PersistOperation {
        const dbEntities = this.extractObjectsById(entity1, metadata);
        const allEntities = this.extractObjectsById(entity2, metadata);
        const insertOperations = this.findCascadeInsertedEntities(metadata, entity2, dbEntities, null);
        const removeOperations = this.findCascadeRemovedEntities(metadata, entity1, allEntities);
        const updateOperations = this.findCascadeUpdateEntities(metadata, entity1, entity2, null);
        const junctionInsertOperations = this.findJunctionInsertOperations(metadata, entity2, dbEntities);
        const junctionRemoveOperations = this.findJunctionRemoveOperations(metadata, entity1, allEntities);
        const updatesByRelationsOperations = this.updateRelations(insertOperations, entity2);
        
        // todo: implement duplicates removal later
        // remove duplicates from inserted entities (todo: shall we check if duplicates differ and throw exception?)
        /*const uniqueInsertOperations = insertOperations.map(insertOperation => {
            const otherInsertOperations = insertOperations.filter(o => o !== insertOperation && o.entity === insertOperation.entity);
            const otherRelations = otherInsertOperations.reduce((relations, o) => {
                return relations.concat(o.relations);
            }, <RelationMetadata[]> []);
            return <InsertOperation> {
                entity: insertOperation.entity,
                relations: insertOperation.relations.concat(otherRelations)
            };
        });*/
        
        // sort inserts
        return new PersistOperation(
            insertOperations, 
            removeOperations, 
            updateOperations, 
            junctionInsertOperations, 
            junctionRemoveOperations,
            updatesByRelationsOperations
        );
    }
    
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------


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

        /*const entitiesWithoutIds = allEntities
         .filter(entityWithId => !!entityWithId.id)
         .map(entityWithId => entityWithId.entity);*/
/*
            entitiesWithoutIds.find(entity => entity === insertOperation.entity);

            metadata.relations.map(relation => {

            });

            const oneToOneManyToOneUpdates = Promise.all(meta.relations.map(relation => {

                let insertOperationUpdates: Promise<any>, updateOperationUpdates: Promise<any>;

                if (insertOperation.entity[relation.propertyName] instanceof Array && relation.isOneToMany) {

                    insertOperationUpdates = Promise.all(persistOperations.inserts.filter(o => {
                        return insertOperation.entity[relation.propertyName].indexOf(o.entity) !== -1;
                    }).map(o => {
                        const oMetadata = this.connection.getMetadata(o.entity.constructor);
                        const inverseRelation = relation.inverseRelation;
                        const query = `UPDATE ${oMetadata.table.name} SET ${inverseRelation.name}='${insertOperation.entityId}' WHERE ${oMetadata.primaryColumn.name}='${o.entityId}'`;
                        return this.connection.driver.query(query);
                    }));

                    updateOperationUpdates = Promise.all(persistOperations.updates.filter(o => {
                        return insertOperation.entity[relation.propertyName].indexOf(o.entity) !== -1;
                    }).map(o => {
                        const oMetadata = this.connection.getMetadata(o.entity.constructor);
                        const inverseRelation = relation.inverseRelation;
                        const id = insertOperation.entity[meta.primaryColumn.name];
                        const query = `UPDATE ${oMetadata.table.name} SET ${inverseRelation.name}='${insertOperation.entityId}' WHERE ${oMetadata.primaryColumn.name}='${id}'`;
                        return this.connection.driver.query(query);
                    }));

                }
                //return Promise.all([insertOperationUpdates, updateOperationUpdates]);
            }));
        });*/
    }
    
    private findJunctionInsertOperations(metadata: EntityMetadata, newEntity: any, dbEntities: EntityWithId[]): JunctionInsertOperation[] {
        const dbEntity = dbEntities.find(dbEntity => {
            return dbEntity.id === newEntity[metadata.primaryColumn.name] && dbEntity.entity.constructor.name === metadata.name;
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
            return newEntity.id === dbEntity[metadata.primaryColumn.name] && newEntity.entity.constructor.name === metadata.name;
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

    private findCascadeInsertedEntities(metadata: EntityMetadata, newEntity: any, dbEntities: EntityWithId[], fromRelation: RelationMetadata): any[] {

        const insertedEntities: any[] = [];
        const isObjectNew = !dbEntities.find(dbEntity => {
            return dbEntity.id === newEntity[metadata.primaryColumn.name] && dbEntity.entity.constructor.name === metadata.name;
        });

        if (isObjectNew && fromRelation && !fromRelation.isCascadeInsert) {
            if (this.strictCascadesMode) {
                throw new Error("Cascade inserts are not allowed in " + metadata.name + "#" + fromRelation.propertyName);
            } else {
                return [];
            }
        }

        if (isObjectNew)
            insertedEntities.push({
                entity: newEntity
            });

        return metadata.relations
            .filter(relation => !!newEntity[relation.propertyName])
            .reduce((insertedEntities, relation) => {
                const relMetadata = relation.relatedEntityMetadata;
                const value = newEntity[relation.propertyName];
                if (value instanceof Array) {
                    value.forEach((subEntity: any) => {
                        const subInserted = this.findCascadeInsertedEntities(relMetadata, subEntity, dbEntities, relation);
                        insertedEntities = insertedEntities.concat(subInserted);
                    });
                } else {
                    const subInserted = this.findCascadeInsertedEntities(relMetadata, value, dbEntities, relation);
                    insertedEntities = insertedEntities.concat(subInserted);
                }

                return insertedEntities;
            }, insertedEntities);
    }
    
    private findCascadeRemovedEntities(metadata: EntityMetadata, dbEntity: any, newEntities: EntityWithId[]): any[] {
        if (!dbEntity)
            return [];
        
        return metadata.relations
            .filter(relation => !!dbEntity[relation.propertyName])
            .reduce((removedEntities, relation) => {
                const relationIdColumnName = relation.relatedEntityMetadata.primaryColumn.name;
                const relMetadata = relation.relatedEntityMetadata;
                if (dbEntity[relation.propertyName] instanceof Array) { // todo: propertyName or name here?
                    dbEntity[relation.propertyName].forEach((subEntity: any) => {
                        const isObjectRemoved = !newEntities.find(newEntity => {
                            return newEntity.id === subEntity[relationIdColumnName] && newEntity.entity.constructor.name === relMetadata.name;
                        });
                        if (isObjectRemoved && relation.isCascadeRemove)
                            removedEntities.push({
                                entity: subEntity,
                                fromEntityId: dbEntity[metadata.primaryColumn.name],
                                metadata: metadata,
                                relation: relation
                            });

                        removedEntities = removedEntities.concat(this.findCascadeRemovedEntities(relMetadata, subEntity, newEntities));
                    });
                } else {
                    const relationId = dbEntity[relation.propertyName][relationIdColumnName];
                    const isObjectRemoved = !newEntities.find(newEntity => {
                        return newEntity.id === relationId && newEntity.entity.constructor.name === relMetadata.name;
                    });
                    if (isObjectRemoved && relation.isCascadeRemove)
                        removedEntities.push({
                            entity: dbEntity[relation.propertyName],
                            fromEntityId: dbEntity[metadata.primaryColumn.name],
                            metadata: metadata,
                            relation: relation
                        });

                    removedEntities = removedEntities.concat(this.findCascadeRemovedEntities(relMetadata, dbEntity[relation.propertyName], newEntities));
                }
                
                return removedEntities;
            }, []);
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
                entity: entity//.constructor.name
            }])
            .filter((entity: any, index: number, allEntities: any[]) => allEntities.indexOf(entity) === index); // unique
    }

    private findCascadeUpdateEntities(metadata: EntityMetadata, dbEntity: any, newEntity: any, fromRelation: RelationMetadata): UpdateOperation[] {
        if (!dbEntity)
            return [];

        const updatedEntities: any[] = [];
        const diff = this.diffColumns(metadata, newEntity, dbEntity);
        if (diff.length && fromRelation && !fromRelation.isCascadeUpdate) {
            if (this.strictCascadesMode) {
                throw new Error("Cascade updates are not allowed in " + metadata.name + "#" + fromRelation.propertyName);
            } else {
                return [];
            }
        }

        if (diff.length) {
            updatedEntities.push({
                entity: newEntity,
                columns: diff
            });
        }
        
        return metadata.relations
            .filter(relation => newEntity[relation.propertyName] && dbEntity[relation.propertyName])
            .reduce((updatedColumns, relation) => {
                const relMetadata = relation.relatedEntityMetadata;
                const relationIdColumnName = relMetadata.primaryColumn.name;
                if (newEntity[relation.propertyName] instanceof Array) {
                    newEntity[relation.propertyName].forEach((subEntity: any) => {
                        const subDbEntity = (dbEntity[relation.propertyName] as any[]).find(subDbEntity => {
                            return subDbEntity[relationIdColumnName] === subEntity[relationIdColumnName];
                        });
                        if (subDbEntity) {
                            const relationUpdatedColumns = this.findCascadeUpdateEntities(relMetadata, subDbEntity, subEntity, relation);
                            updatedColumns = updatedColumns.concat(relationUpdatedColumns);
                        }

                    });
                } else {
                    const relationUpdatedColumns = this.findCascadeUpdateEntities(relMetadata,  dbEntity[relation.propertyName], newEntity[relation.propertyName], relation);
                    updatedColumns = updatedColumns.concat(relationUpdatedColumns);
                }

                return updatedColumns;
            }, updatedEntities);
    }

    private diffColumns(metadata: EntityMetadata, newEntity: any, dbEntity: any) {
        return metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => newEntity[column.propertyName] !== dbEntity[column.propertyName]);
    }

}