import {PersistOperation} from "./operation/PersistOperation";
import {RemoveOperation} from "./operation/RemoveOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {JunctionRemoveOperation} from "./operation/JunctionRemoveOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {Broadcaster} from "../subscriber/Broadcaster";
import {EntityMetadataCollection} from "../metadata/collection/EntityMetadataCollection";
import {Driver} from "../driver/Driver";

/**
 * Executes PersistOperation in the given connection.
 * @internal
 */
export class PersistOperationExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(private driver: Driver,
                private entityMetadatas: EntityMetadataCollection,
                private broadcaster: Broadcaster) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes given persist operation.
     */
    executePersistOperation(persistOperation: PersistOperation) {
        
        return Promise.resolve()
            .then(() => this.broadcastBeforeEvents(persistOperation))
            .then(() => this.driver.beginTransaction())
            .then(() => this.executeInsertOperations(persistOperation))
            .then(() => this.executeInsertClosureTableOperations(persistOperation))
            .then(() => this.executeUpdateTreeLevelOperations(persistOperation))
            .then(() => this.executeInsertJunctionsOperations(persistOperation))
            .then(() => this.executeRemoveJunctionsOperations(persistOperation))
            .then(() => this.executeRemoveRelationOperations(persistOperation))
            .then(() => this.executeUpdateRelationsOperations(persistOperation))
            .then(() => this.executeUpdateOperations(persistOperation))
            .then(() => this.executeRemoveOperations(persistOperation))
            .then(() => this.driver.endTransaction())
            .then(() => this.updateIdsOfInsertedEntities(persistOperation))
            .then(() => this.updateIdsOfRemovedEntities(persistOperation))
            .then(() => this.updateSpecialColumnsInEntities(persistOperation))
            .then(() => this.broadcastAfterEvents(persistOperation));
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcast all before persistment events - beforeInsert, beforeUpdate and beforeRemove events.
     */
    private broadcastBeforeEvents(persistOperation: PersistOperation) {

        const insertEvents = persistOperation.inserts.map(insertOperation => {
            const persistedEntityWithId = persistOperation.allPersistedEntities.find(e => e.entity === insertOperation.entity);
            return this.broadcaster.broadcastBeforeInsertEvent(persistedEntityWithId.entity);
        });
        const updateEvents = persistOperation.updates.map(updateOperation => {
            const persistedEntityWithId = persistOperation.allPersistedEntities.find(e => e.entity === updateOperation.entity);
            return this.broadcaster.broadcastBeforeUpdateEvent(persistedEntityWithId.entity, updateOperation.columns);
        });
        const removeEvents = persistOperation.removes.map(removeOperation => {
            // we can send here only dbEntity, not entity from the persisted object, since entity from the persisted
            // object does not exist anymore - its removed, and there is no way to find this removed object
            return this.broadcaster.broadcastBeforeRemoveEvent(removeOperation.entity, removeOperation.entityId);
        });
        
        return Promise.all(insertEvents)
            .then(() => Promise.all(updateEvents))
            .then(() => Promise.all(removeEvents)); // todo: do we really should send it in order?
    }

    /**
     * Broadcast all after persistment events - afterInsert, afterUpdate and afterRemove events.
     */
    private broadcastAfterEvents(persistOperation: PersistOperation) {
        
        const insertEvents = persistOperation.inserts.map(insertOperation => {
            const persistedEntity = persistOperation.allPersistedEntities.find(e => e.entity === insertOperation.entity);
            return this.broadcaster.broadcastAfterInsertEvent(persistedEntity.entity);
        });
        const updateEvents = persistOperation.updates.map(updateOperation => {
            const persistedEntityWithId = persistOperation.allPersistedEntities.find(e => e.entity === updateOperation.entity);
            return this.broadcaster.broadcastAfterUpdateEvent(persistedEntityWithId.entity, updateOperation.columns);
        });
        const removeEvents = persistOperation.removes.map(removeOperation => {
            // we can send here only dbEntity, not entity from the persisted object, since entity from the persisted
            // object does not exist anymore - its removed, and there is no way to find this removed object
            return this.broadcaster.broadcastAfterRemoveEvent(removeOperation.entity, removeOperation.entityId);
        });
        
        return Promise.all(insertEvents)
            .then(() => Promise.all(updateEvents))
            .then(() => Promise.all(removeEvents)); // todo: do we really should send it in order?
    }

    /**
     * Executes insert operations.
     */
    private executeInsertOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.inserts.map(operation => {
            return this.insert(operation).then((insertId: any) => {
                operation.entityId = insertId;
            });
        }));
    }

    /**
     * Executes insert operations for closure tables.
     */
    private executeInsertClosureTableOperations(persistOperation: PersistOperation) {
        const promises = persistOperation.inserts
            .filter(operation => {
                const metadata = this.entityMetadatas.findByTarget(operation.entity.constructor);
                return metadata.table.isClosure;
            })
            .map(operation => {
                const relationsUpdateMap = this.findUpdateOperationForEntity(persistOperation.updatesByRelations, persistOperation.inserts, operation.entity);
                return this.insertIntoClosureTable(operation, relationsUpdateMap).then(level => {
                    operation.treeLevel = level;
                });
            });
        return Promise.all(promises);
    }

    /**
     * Executes update tree level operations in inserted entities right after data into closure table inserted.
     */
    private executeUpdateTreeLevelOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.inserts.map(operation => {
            return this.updateTreeLevel(operation);
        }));
    }

    /**
     * Executes insert junction operations.
     */
    private executeInsertJunctionsOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.junctionInserts.map(junctionOperation => {
            return this.insertJunctions(junctionOperation, persistOperation.inserts);
        }));
    }

    /**
     * Executes remove junction operations.
     */
    private executeRemoveJunctionsOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.junctionRemoves.map(junctionOperation => {
            return this.removeJunctions(junctionOperation);
        }));
    }

    /**
     * Executes update relations operations.
     */
    private executeUpdateRelationsOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.updatesByRelations.map(updateByRelation => {
            return this.updateByRelation(updateByRelation, persistOperation.inserts);
        }));
    }

    /**
     * Executes update operations.
     */
    private executeUpdateOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.updates.map(updateOperation => {
            return this.update(updateOperation);
        }));
    }

    /**
     * Executes remove relations operations.
     */
    private executeRemoveRelationOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.removes
            .filter(operation => {
                return !!(operation.relation && !operation.relation.isManyToMany && !operation.relation.isOneToMany);
            })
            .map(operation => {
                return this.updateDeletedRelations(operation);
            })
        );
    }

    /**
     * Executes remove operations.
     */
    private executeRemoveOperations(persistOperation: PersistOperation) {
        return Promise.all(persistOperation.removes.map(operation => {
            return this.delete(operation.entity);
        }));
    }

    /**
     * Updates all ids of the inserted entities.
     */
    private updateIdsOfInsertedEntities(persistOperation: PersistOperation) {
        persistOperation.inserts.forEach(insertOperation => {
            const metadata = this.entityMetadatas.findByTarget(insertOperation.entity.constructor);
            insertOperation.entity[metadata.primaryColumn.propertyName] = insertOperation.entityId;
        });
    }

    /**
     * Updates all special columns of the saving entities (create date, update date, versioning).
     */
    private updateSpecialColumnsInEntities(persistOperation: PersistOperation) {
        persistOperation.inserts.forEach(insertOperation => {
            const metadata = this.entityMetadatas.findByTarget(insertOperation.entity.constructor);
            if (metadata.updateDateColumn)
                insertOperation.entity[metadata.updateDateColumn.propertyName] = insertOperation.date;
            if (metadata.createDateColumn)
                insertOperation.entity[metadata.createDateColumn.propertyName] = insertOperation.date;
            if (metadata.versionColumn)
                insertOperation.entity[metadata.versionColumn.propertyName]++;
            if (metadata.treeLevelColumn) {
                // const parentEntity = insertOperation.entity[metadata.treeParentMetadata.propertyName];
                // const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.name] || 0) : 0;
                insertOperation.entity[metadata.treeLevelColumn.propertyName] = insertOperation.treeLevel;
            }
            if (metadata.treeChildrenCountColumn) {
                insertOperation.entity[metadata.treeChildrenCountColumn.propertyName] = 0;
            }
        });
        persistOperation.updates.forEach(updateOperation => {
            const metadata = this.entityMetadatas.findByTarget(updateOperation.entity.constructor);
            if (metadata.updateDateColumn)
                updateOperation.entity[metadata.updateDateColumn.propertyName] = updateOperation.date;
            if (metadata.createDateColumn)
                updateOperation.entity[metadata.createDateColumn.propertyName] = updateOperation.date;
            if (metadata.versionColumn)
                updateOperation.entity[metadata.versionColumn.propertyName]++;
        });
    }

    /**
     * Removes all ids of the removed entities.
     */
    private updateIdsOfRemovedEntities(persistOperation: PersistOperation) {
        persistOperation.removes.forEach(removeOperation => {
            const metadata = this.entityMetadatas.findByTarget(removeOperation.entity.constructor);
            const removedEntity = persistOperation.allPersistedEntities.find(allNewEntity => {
                return allNewEntity.entity.constructor === removeOperation.entity.constructor && allNewEntity.id === removeOperation.entity[metadata.primaryColumn.name];
            });
            if (removedEntity)
                removedEntity.entity[metadata.primaryColumn.propertyName] = undefined;
        });
    }

    private findUpdateOperationForEntity(operations: UpdateByRelationOperation[], insertOperations: InsertOperation[], target: any): { [key: string]: any } {

        let updateMap: { [key: string]: any } = {};
        operations
            .forEach(operation => { // duplication with updateByRelation method
                const relatedInsertOperation = insertOperations.find(o => o.entity === operation.targetEntity);
                const idInInserts = relatedInsertOperation ? relatedInsertOperation.entityId : null;
                if (operation.updatedRelation.isOneToMany) {
                    const metadata = this.entityMetadatas.findByTarget(operation.insertOperation.entity.constructor);
                    if (operation.insertOperation.entity === target)
                        updateMap[operation.updatedRelation.inverseRelation.name] = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;

                } else {
                    if (operation.targetEntity === target)
                        updateMap[operation.updatedRelation.name] = operation.insertOperation.entityId;
                }
            });

        return updateMap;
    }

    private updateByRelation(operation: UpdateByRelationOperation, insertOperations: InsertOperation[]) {
        let tableName: string, relationName: string, relationId: any, idColumn: string, id: any;
        const relatedInsertOperation = insertOperations.find(o => o.entity === operation.targetEntity);
        const idInInserts = relatedInsertOperation ? relatedInsertOperation.entityId : null;
        if (operation.updatedRelation.isOneToMany) {
            const metadata = this.entityMetadatas.findByTarget(operation.insertOperation.entity.constructor);
            tableName = metadata.table.name;
            relationName = operation.updatedRelation.inverseRelation.name;
            relationId = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;
            idColumn = metadata.primaryColumn.name;
            id = operation.insertOperation.entityId;

        } else {
            const metadata = this.entityMetadatas.findByTarget(operation.targetEntity.constructor);
            tableName = metadata.table.name;
            relationName = operation.updatedRelation.name;
            relationId = operation.insertOperation.entityId;
            idColumn = metadata.primaryColumn.name;
            id = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;
        }
        return this.driver.update(tableName, { [relationName]: relationId }, { [idColumn]: id });
    }

    private update(updateOperation: UpdateOperation) {
        const entity = updateOperation.entity;
        const metadata = this.entityMetadatas.findByTarget(entity.constructor);
        const values: { [key: string]: any } = {};
        
        updateOperation.columns.forEach(column => {
            values[column.name] = this.driver.preparePersistentValue(entity[column.propertyName], column);
        });
        
        updateOperation.relations.forEach(relation => {
            values[relation.name] = entity[relation.propertyName] ? entity[relation.propertyName][relation.inverseEntityMetadata.primaryColumn.propertyName] : null;
        });

        // if number of updated columns = 0 no need to update updated date and version columns
        if (Object.keys(values).length === 0)
            return Promise.resolve();

        if (metadata.updateDateColumn)
            values[metadata.updateDateColumn.name] = this.driver.preparePersistentValue(new Date(), metadata.updateDateColumn);

        if (metadata.versionColumn)
            values[metadata.versionColumn.name] = this.driver.preparePersistentValue(entity[metadata.versionColumn.propertyName] + 1, metadata.versionColumn);
        
        return this.driver.update(metadata.table.name, values, { [metadata.primaryColumn.name]: metadata.getEntityId(entity) });
    }

    private updateDeletedRelations(removeOperation: RemoveOperation) { // todo: check if both many-to-one deletions work too
        if (removeOperation.relation) {
            return this.driver.update(
                removeOperation.fromMetadata.table.name,
                { [removeOperation.relation.name]: null },
                { [removeOperation.fromMetadata.primaryColumn.name]: removeOperation.fromEntityId }
            );   
        }

        throw new Error("Remove operation relation is not set"); // todo: find out how its possible
    }

    private delete(entity: any) {
        const metadata = this.entityMetadatas.findByTarget(entity.constructor);
        return this.driver.delete(metadata.table.name, { [metadata.primaryColumn.name]: entity[metadata.primaryColumn.propertyName] });
    }

    private insert(operation: InsertOperation) {
        const entity = operation.entity;
        const metadata = this.entityMetadatas.findByTarget(entity.constructor);
        const columns = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => entity.hasOwnProperty(column.propertyName))
            .map(column => column.name);
        const values = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => entity.hasOwnProperty(column.propertyName))
            .map(column => this.driver.preparePersistentValue(entity[column.propertyName], column));
        const relationColumns = metadata.relations
            .filter(relation => relation.isOwning && !!relation.inverseEntityMetadata)
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .filter(relation => entity[relation.propertyName][relation.inverseEntityMetadata.primaryColumn.name])
            .map(relation => relation.name);

        const relationValues = metadata.relations
            .filter(relation => relation.isOwning && !!relation.inverseEntityMetadata)
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .filter(relation => entity[relation.propertyName].hasOwnProperty(relation.inverseEntityMetadata.primaryColumn.name))
            .map(relation => entity[relation.propertyName][relation.inverseEntityMetadata.primaryColumn.name]);

        const allColumns = columns.concat(relationColumns);
        const allValues = values.concat(relationValues);

        if (metadata.createDateColumn) {
            allColumns.push(metadata.createDateColumn.name);
            allValues.push(this.driver.preparePersistentValue(operation.date, metadata.createDateColumn));
        }

        if (metadata.updateDateColumn) {
            allColumns.push(metadata.updateDateColumn.name);
            allValues.push(this.driver.preparePersistentValue(operation.date, metadata.updateDateColumn));
        }

        if (metadata.versionColumn) {
            allColumns.push(metadata.versionColumn.name);
            allValues.push(this.driver.preparePersistentValue(1, metadata.versionColumn));
        }
        
        if (metadata.treeLevelColumn) {
            const parentEntity = entity[metadata.treeParentRelation.propertyName];
            const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.name] || 0) : 0;
            
            allColumns.push(metadata.treeLevelColumn.name);
            allValues.push(parentLevel + 1);
        }
        
        if (metadata.treeChildrenCountColumn) {
            allColumns.push(metadata.treeChildrenCountColumn.name);
            allValues.push(0);
        }
        
        return this.driver.insert(metadata.table.name, this.zipObject(allColumns, allValues));
    }

    private insertIntoClosureTable(operation: InsertOperation, updateMap: { [key: string]: any }) {
        const entity = operation.entity;
        const metadata = this.entityMetadatas.findByTarget(entity.constructor);
        const parentEntity = entity[metadata.treeParentRelation.propertyName];
        const hasLevel = !!metadata.treeLevelColumn;

        let parentEntityId: any = 0;
        if (parentEntity && parentEntity[metadata.primaryColumn.name]) {
            parentEntityId = parentEntity[metadata.primaryColumn.name];
        } else if (updateMap && updateMap[metadata.treeParentRelation.propertyName]) { // todo: name or propertyName: depend how update will be implemented. or even find relation of this treeParent and use its name?
            parentEntityId = updateMap[metadata.treeParentRelation.propertyName];
        }
        
        return this.driver.insertIntoClosureTable(metadata.closureJunctionTable.table.name, operation.entityId, parentEntityId, hasLevel)
            /*.then(() => {
                // we also need to update children count in parent
                if (parentEntity && parentEntityId) {
                    const values = { [metadata.treeChildrenCountColumn.name]: parentEntity[metadata.treeChildrenCountColumn.name] + 1 };
                    return this.driver.update(metadata.table.name, values, { [metadata.primaryColumn.name]: parentEntityId });
                }
                return;
            })*/;
    }

    private updateTreeLevel(operation: InsertOperation) {
        const metadata = this.entityMetadatas.findByTarget(operation.entity.constructor);

        if (metadata.treeLevelColumn && operation.treeLevel) {
            const values = { [metadata.treeLevelColumn.name]: operation.treeLevel };
            return this.driver.update(metadata.table.name, values, { [metadata.primaryColumn.name]: operation.entityId });
        }
        
        return Promise.resolve();

    }

    private insertJunctions(junctionOperation: JunctionInsertOperation, insertOperations: InsertOperation[]) {
        const junctionMetadata = junctionOperation.metadata;
        const metadata1 = this.entityMetadatas.findByTarget(junctionOperation.entity1.constructor);
        const metadata2 = this.entityMetadatas.findByTarget(junctionOperation.entity2.constructor);
        const columns = junctionMetadata.columns.map(column => column.name);
        const id1 = junctionOperation.entity1[metadata1.primaryColumn.name] || insertOperations.find(o => o.entity === junctionOperation.entity1).entityId;
        const id2 = junctionOperation.entity2[metadata2.primaryColumn.name] || insertOperations.find(o => o.entity === junctionOperation.entity2).entityId;
        
        let values: any[]; 
        // order may differ, find solution (column.table to compare with entity metadata table?)
        if (metadata1.table === junctionMetadata.foreignKeys[0].table) {
            values = [id1, id2];
        } else {
            values = [id2, id1];
        }
        
        return this.driver.insert(junctionMetadata.table.name, this.zipObject(columns, values));
    }

    private removeJunctions(junctionOperation: JunctionRemoveOperation) {
        const junctionMetadata = junctionOperation.metadata;
        const metadata1 = this.entityMetadatas.findByTarget(junctionOperation.entity1.constructor);
        const metadata2 = this.entityMetadatas.findByTarget(junctionOperation.entity2.constructor);
        const columns = junctionMetadata.columns.map(column => column.name);
        const id1 = junctionOperation.entity1[metadata1.primaryColumn.name];
        const id2 = junctionOperation.entity2[metadata2.primaryColumn.name];
        return this.driver.delete(junctionMetadata.table.name, { [columns[0]]: id1, [columns[1]]: id2 });
    }

    private zipObject(keys: any[], values: any[]): Object {
        return keys.reduce((object, column, index) => {
            (<any> object)[column] = values[index];
            return object;
        }, {});
    }

}