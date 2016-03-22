import {Connection} from "../connection/Connection";
import {PersistOperation} from "./operation/PersistOperation";
import {RemoveOperation} from "./operation/RemoveOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {JunctionRemoveOperation} from "./operation/JunctionRemoveOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";

/**
 * Executes PersistOperation in the given connection.
 */
export class PersistOperationExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes given persist operation.
     */
    executePersistOperation(persistOperation: PersistOperation) {
        const broadcaster = new OrmBroadcaster(this.connection);
        // persistOperation.log();
        
        return Promise.resolve()
            .then(() => this.broadcastBeforeEvents(broadcaster, persistOperation))
            .then(() => this.connection.driver.beginTransaction())
            .then(() => this.executeInsertOperations(persistOperation))
            .then(() => this.executeInsertJunctionsOperations(persistOperation))
            .then(() => this.executeRemoveJunctionsOperations(persistOperation))
            .then(() => this.executeUpdateRelationsOperations(persistOperation))
            .then(() => this.executeUpdateOperations(persistOperation))
            .then(() => this.executeRemoveRelationOperations(persistOperation))
            .then(() => this.executeRemoveOperations(persistOperation))
            .then(() => this.connection.driver.endTransaction())
            .then(() => this.updateIdsOfInsertedEntities(persistOperation))
            .then(() => this.updateIdsOfRemovedEntities(persistOperation))
            .then(() => this.broadcastAfterEvents(broadcaster, persistOperation));
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcast all before persistment events - beforeInsert, beforeUpdate and beforeRemove events.
     */
    private broadcastBeforeEvents(broadcaster: OrmBroadcaster, persistOperation: PersistOperation) {
        
        const insertEvents = persistOperation.inserts.map(insertOperation => {
            const persistedEntityWithId = persistOperation.allPersistedEntities.find(e => e.entity === insertOperation.entity);
            return broadcaster.broadcastBeforeInsertEvent(persistedEntityWithId.entity);
        });
        const updateEvents = persistOperation.updates.map(updateOperation => {
            const persistedEntityWithId = persistOperation.allPersistedEntities.find(e => e.entity === updateOperation.entity);
            return broadcaster.broadcastBeforeUpdateEvent(persistedEntityWithId.entity, updateOperation.columns);
        });
        const removeEvents = persistOperation.removes.map(removeOperation => {
            // we can send here only dbEntity, not entity from the persisted object, since entity from the persisted
            // object does not exist anymore - its removed, and there is no way to find this removed object
            return broadcaster.broadcastBeforeRemoveEvent(removeOperation.entity, removeOperation.entityId);
        });
        
        return Promise.all(insertEvents)
            .then(() => Promise.all(updateEvents))
            .then(() => Promise.all(removeEvents)); // todo: do we really should send it in order?
    }

    /**
     * Broadcast all after persistment events - afterInsert, afterUpdate and afterRemove events.
     */
    private broadcastAfterEvents(broadcaster: OrmBroadcaster, persistOperation: PersistOperation) {
        
        const insertEvents = persistOperation.inserts.map(insertOperation => {
            const persistedEntity = persistOperation.allPersistedEntities.find(e => e.entity === insertOperation.entity);
            return broadcaster.broadcastAfterInsertEvent(persistedEntity.entity);
        });
        const updateEvents = persistOperation.updates.map(updateOperation => {
            const persistedEntityWithId = persistOperation.allPersistedEntities.find(e => e.entity === updateOperation.entity);
            return broadcaster.broadcastAfterUpdateEvent(persistedEntityWithId.entity, updateOperation.columns);
        });
        const removeEvents = persistOperation.removes.map(removeOperation => {
            // we can send here only dbEntity, not entity from the persisted object, since entity from the persisted
            // object does not exist anymore - its removed, and there is no way to find this removed object
            return broadcaster.broadcastAfterRemoveEvent(removeOperation.entity, removeOperation.entityId);
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
            return this.insert(operation.entity).then((result: any) => {
                operation.entityId = result.insertId;
            });
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
            this.updateByRelation(updateByRelation, persistOperation.inserts);
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
            .filter(operation => operation.relation && !operation.relation.isManyToMany && !operation.relation.isOneToMany)
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
            const metadata = this.connection.getEntityMetadata(insertOperation.entity.constructor);
            insertOperation.entity[metadata.primaryColumn.name] = insertOperation.entityId;
        });
    }

    /**
     * Removes all ids of the removed entities.
     */
    private updateIdsOfRemovedEntities(persistOperation: PersistOperation) {
        persistOperation.removes.forEach(removeOperation => {
            const metadata = this.connection.getEntityMetadata(removeOperation.entity.constructor);
            const removedEntity = persistOperation.allPersistedEntities.find(allNewEntity => {
                return allNewEntity.entity.constructor === removeOperation.entity.constructor && allNewEntity.id === removeOperation.entity[metadata.primaryColumn.name];
            });
            if (removedEntity)
                removedEntity.entity[metadata.primaryColumn.propertyName] = undefined;
        });
    }

    private updateByRelation(operation: UpdateByRelationOperation, insertOperations: InsertOperation[]) {
        let tableName: string, relationName: string, relationId: any, idColumn: string, id: any;
        const idInInserts = insertOperations.find(o => o.entity === operation.targetEntity).entityId;
        if (operation.updatedRelation.isOneToMany) {
            const metadata = this.connection.getEntityMetadata(operation.insertOperation.entity.constructor);
            tableName = metadata.table.name;
            relationName = operation.updatedRelation.inverseRelation.name;
            relationId = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;
            idColumn = metadata.primaryColumn.name;
            id = operation.insertOperation.entityId;

        } else {
            const metadata = this.connection.getEntityMetadata(operation.targetEntity.constructor);
            tableName = metadata.table.name;
            relationName = operation.updatedRelation.name;
            relationId = operation.insertOperation.entityId;
            idColumn = metadata.primaryColumn.name;
            id = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;
        }
        return this.connection.driver.update(tableName, { [relationName]: relationId }, { [idColumn]: id });
    }

    private update(updateOperation: UpdateOperation) {
        const entity = updateOperation.entity;
        const metadata = this.connection.getEntityMetadata(entity.constructor);
        const values = updateOperation.columns.reduce((object, column) => {
            (<any> object)[column.name] = entity[column.propertyName];
            return object;
        }, {});
        return this.connection.driver.update(metadata.table.name, values, { [metadata.primaryColumn.name]: metadata.getEntityId(entity) });
    }

    private updateDeletedRelations(removeOperation: RemoveOperation) { // todo: check if both many-to-one deletions work too
        return this.connection.driver.update(
            removeOperation.fromMetadata.table.name, 
            { [removeOperation.relation.name]: null },
            { [removeOperation.fromMetadata.primaryColumn.name]: removeOperation.fromEntityId }
        );
    }

    private delete(entity: any) {
        const metadata = this.connection.getEntityMetadata(entity.constructor);
        return this.connection.driver.delete(metadata.table.name, { [metadata.primaryColumn.name]: entity[metadata.primaryColumn.propertyName] });
    }

    private insert(entity: any) {
        const metadata = this.connection.getEntityMetadata(entity.constructor);
        const columns = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => entity.hasOwnProperty(column.propertyName))
            .map(column => column.name);
        const values = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => entity.hasOwnProperty(column.propertyName))
            .map(column => "'" + entity[column.propertyName] + "'");
        const relationColumns = metadata.relations
            .filter(relation => relation.isOwning && !!relation.relatedEntityMetadata)
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .filter(relation => entity[relation.propertyName][relation.relatedEntityMetadata.primaryColumn.name])
            .map(relation => relation.name);

        const relationValues = metadata.relations
            .filter(relation => relation.isOwning && !!relation.relatedEntityMetadata)
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .filter(relation => entity[relation.propertyName].hasOwnProperty(relation.relatedEntityMetadata.primaryColumn.name))
            .map(relation => "'" + entity[relation.propertyName][relation.relatedEntityMetadata.primaryColumn.name] + "'");

        const allColumns = columns.concat(relationColumns);
        const allValues = values.concat(relationValues);
        
        return this.connection.driver.insert(metadata.table.name, this.zipObject(allColumns, allValues));
    }

    private insertJunctions(junctionOperation: JunctionInsertOperation, insertOperations: InsertOperation[]) {
        const junctionMetadata = junctionOperation.metadata;
        const metadata1 = this.connection.getEntityMetadata(junctionOperation.entity1.constructor);
        const metadata2 = this.connection.getEntityMetadata(junctionOperation.entity2.constructor);
        const columns = junctionMetadata.columns.map(column => column.name);
        const id1 = junctionOperation.entity1[metadata1.primaryColumn.name] || insertOperations.find(o => o.entity === junctionOperation.entity1).entityId;
        const id2 = junctionOperation.entity2[metadata2.primaryColumn.name] || insertOperations.find(o => o.entity === junctionOperation.entity2).entityId;
        const values = [id1, id2]; // todo: order may differ, find solution (column.table to compare with entity metadata table?)
        return this.connection.driver.insert(junctionMetadata.table.name, this.zipObject(columns, values));
    }

    private removeJunctions(junctionOperation: JunctionRemoveOperation) {
        const junctionMetadata = junctionOperation.metadata;
        const metadata1 = this.connection.getEntityMetadata(junctionOperation.entity1.constructor);
        const metadata2 = this.connection.getEntityMetadata(junctionOperation.entity2.constructor);
        const columns = junctionMetadata.columns.map(column => column.name);
        const id1 = junctionOperation.entity1[metadata1.primaryColumn.name];
        const id2 = junctionOperation.entity2[metadata2.primaryColumn.name];
        return this.connection.driver.delete(junctionMetadata.table.name, { [columns[0]]: id1, [columns[1]]: id2 });
    }

    private zipObject(keys: any[], values: any[]): Object {
        return keys.reduce((object, column, index) => {
            (<any> object)[column] = values[index];
            return object;
        }, {});
    }

}