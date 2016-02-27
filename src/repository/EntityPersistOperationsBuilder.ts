import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata-builder/metadata/ColumnMetadata";
import {EntityDifferenceMap} from "./Repository";

interface EntityWithId {
    id: any;
    entity: any;
}

interface UpdateOperation {
    entity: any;
    columns: ColumnMetadata[];
}

export class EntityPersistOperationsBuilder {

    // 1. collect all exist objects from the db entity
    // 2. collect all objects from the new entity
    // 3. first need to go throw all relations of the new entity and:
    //      3.1. find all objects that are new (e.g. cascade="insert") by comparing ids from the exist objects
    //      3.2. check if relation has rights to do cascade operation and throw exception if it cannot
    //      3.3. save new objects for insert operation
    // 4. second need to go throw all relations of the db entity and:
    //      4.1. find all objects that are removed (e.g. cascade="remove") by comparing data with collected objects of the new entity
    //      4.2. check if relation has rights to do cascade operation and throw exception if it cannot
    //      4.3. save new objects for remove operation
    // 5. third need to go throw collection of all new entities
    //      5.1. compare with entities from the collection of db entities, find difference and generate a change set
    //      5.2. check if relation has rights to do cascade operation and throw exception if it cannot
    //      5.3.

    // if relation has "all" then all of above:
    // if relation has "insert" it can insert a new entity
    // if relation has "update" it can only update related entity
    // if relation has "remove" it can only remove related entity

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    difference(metadata: EntityMetadata, entity1: any, entity2: any): EntityDifferenceMap[] {
        const diffMaps: EntityDifferenceMap[] = [];
        const dbEntities = this.extractObjectsById(entity1, metadata);
        const allEntities = this.extractObjectsById(entity2, metadata);
        const insertedEntities = this.findCascadeInsertedEntities(entity2, metadata, dbEntities);
        const removedEntities = this.findCascadeRemovedEntities(entity1, metadata, allEntities);
        const updatedEntities = this.findCascadeUpdateEntities(metadata, entity1, entity2);
        console.log("---------------------------------------------------------");
        console.log("DB ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(dbEntities);
        console.log("---------------------------------------------------------");
        console.log("ALL NEW ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(allEntities);
        console.log("---------------------------------------------------------");
        console.log("INSERTED ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(insertedEntities);
        console.log("---------------------------------------------------------");
        console.log("REMOVED ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(removedEntities);
        console.log("---------------------------------------------------------");
        console.log("UPDATED ENTITIES");
        console.log("---------------------------------------------------------");
        console.log(updatedEntities);
        console.log("---------------------------------------------------------");
        return diffMaps;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private diffColumns(metadata: EntityMetadata, newEntity: any, dbEntity: any) {
        return metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => newEntity[column.propertyName] !== dbEntity[column.propertyName]);
    }
    
    private findCascadeUpdateEntities(metadata: EntityMetadata, newEntity: any, dbEntity: any): UpdateOperation[] {
        const updatedColumns = [{
            entity: newEntity,
            columns: this.diffColumns(metadata, newEntity, dbEntity)
        }];
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
                            const relationUpdatedColumns = this.findCascadeUpdateEntities(relMetadata, subEntity, subDbEntity);
                            if (!relation.isCascadeUpdate)
                                throw new Error("Cascade updates are not allowed in " + metadata.name + "#" + relation.propertyName);
                            
                            updatedColumns = updatedColumns.concat(relationUpdatedColumns);
                        }

                    });
                } else {
                    const relationUpdatedColumns = this.findCascadeUpdateEntities(relMetadata, newEntity[relation.propertyName], dbEntity[relation.propertyName]);
                    if (updatedColumns.length > 0) {
                        if (!relation.isCascadeUpdate)
                            throw new Error("Cascade updates are not allowed in " + metadata.name + "#" + relation.propertyName);

                        updatedColumns = updatedColumns.concat(relationUpdatedColumns);
                    }
                }

                return updatedColumns;
            }, updatedColumns);
    }

    private findCascadeInsertedEntities(newEntity: any, metadata: EntityMetadata, dbEntities: any[]): any[] {
        return metadata.relations
            .filter(relation => !!newEntity[relation.propertyName])
            .reduce((insertedEntities, relation) => {
                const relationIdColumnName = relation.relatedEntityMetadata.primaryColumn.name;
                const relMetadata = relation.relatedEntityMetadata;
                if (newEntity[relation.propertyName] instanceof Array) {
                    newEntity[relation.propertyName].forEach((subEntity: any) => {
                        const isObjectNew = !dbEntities.find(dbEntity => {
                            return dbEntity.id === subEntity[relationIdColumnName] && dbEntity.entity === relMetadata.name;
                        });
                        if (isObjectNew) {
                            if (!relation.isCascadeInsert)
                                throw new Error("Cascade inserts are not allowed in " + metadata.name + "#" + relation.propertyName);

                            insertedEntities.push(subEntity);
                        }

                        insertedEntities = insertedEntities.concat(this.findCascadeInsertedEntities(subEntity, relMetadata, dbEntities));
                    });
                } else {
                    const relationId = newEntity[relation.propertyName][relationIdColumnName];
                    const isObjectNew = !dbEntities.find(dbEntity => {
                        return dbEntity.id === relationId && dbEntity.entity === relMetadata.name;
                    });
                    if (isObjectNew) {
                        if (!relation.isCascadeInsert)
                            throw new Error("Cascade inserts are not allowed in " + metadata.name + "#" + relation.propertyName);

                        insertedEntities.push(newEntity[relation.propertyName]);
                    }
                    insertedEntities = insertedEntities.concat(this.findCascadeInsertedEntities(newEntity[relation.propertyName], relMetadata, dbEntities));
                }
                
                return insertedEntities;
            }, []);
    }

    private findCascadeRemovedEntities(dbEntity: any, metadata: EntityMetadata, newEntities: any[]): any[] {
        return metadata.relations
            .filter(relation => !!dbEntity[relation.propertyName])
            .reduce((removedEntities, relation) => {
                const relationIdColumnName = relation.relatedEntityMetadata.primaryColumn.name;
                const relMetadata = relation.relatedEntityMetadata;
                if (dbEntity[relation.propertyName] instanceof Array) {
                    dbEntity[relation.propertyName].forEach((subEntity: any) => {
                        const isObjectRemoved = !newEntities.find(newEntity => {
                            return newEntity.id === subEntity[relationIdColumnName] && newEntity.entity === relMetadata.name;
                        });
                        if (isObjectRemoved && relation.isCascadeRemove)
                            removedEntities.push(subEntity);

                        removedEntities = removedEntities.concat(this.findCascadeRemovedEntities(subEntity, relMetadata, newEntities));
                    });
                } else {
                    const relationId = dbEntity[relation.propertyName][relationIdColumnName];
                    const isObjectRemoved = !newEntities.find(newEntity => {
                        return newEntity.id === relationId && newEntity.entity === relMetadata.name;
                    });
                    if (isObjectRemoved && relation.isCascadeRemove)
                        removedEntities.push(dbEntity[relation.propertyName]);

                    removedEntities = removedEntities.concat(this.findCascadeRemovedEntities(dbEntity[relation.propertyName], relMetadata, newEntities));
                }
                
                return removedEntities;
            }, []);
    }

    /**
     * Extracts unique objects from given entity and all its downside relations.
     */
    private extractObjectsById(entity: any, metadata: EntityMetadata): EntityWithId[] {
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
                entity: entity.constructor.name
            }])
            .filter((entity: any, index: number, allEntities: any[]) => allEntities.indexOf(entity) === index); // unique
    }

}