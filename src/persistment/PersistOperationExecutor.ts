import {Connection} from "../connection/Connection";
import {PersistOperation} from "./operation/PersistOperation";
import {RemoveOperation} from "./operation/RemoveOperation";
import {UpdateOperation} from "./operation/UpdateOperation";
import {JunctionInsertOperation} from "./operation/JunctionInsertOperation";
import {InsertOperation} from "./operation/InsertOperation";
import {JunctionRemoveOperation} from "./operation/JunctionRemoveOperation";
import {UpdateByRelationOperation} from "./operation/UpdateByRelationOperation";

export class PersistOperationExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    executePersistOperation(persistOperation: PersistOperation) {
        return Promise.resolve()
            .then(() => { // insert new relations
                return Promise.all(persistOperation.inserts.map(operation => {
                    return this.insert(operation.entity).then((result: any) => {
                        operation.entityId = result.insertId;
                    });
                }));
    
            }).then(() => { // insert junction table insertions
    
                return Promise.all(persistOperation.junctionInserts.map(junctionOperation => {
                    return this.insertJunctions(junctionOperation, persistOperation.inserts);
                }));
            }).then(() => { // remove junction table insertions
    
                return Promise.all(persistOperation.junctionRemoves.map(junctionOperation => {
                    return this.removeJunctions(junctionOperation);
                }));
    
            }).then(() => {
    
                return Promise.all(persistOperation.updatesByRelations.map(updateByRelation => {
                    this.updateByRelation(updateByRelation, persistOperation.inserts);
                }));
    
            }).then(() => { // perform updates
    
                return Promise.all(persistOperation.updates.map(updateOperation => {
                    return this.update(updateOperation);
                }));
    
            }).then(() => { // remove removed relations
                return Promise.all(persistOperation.removes.map(operation => {
                    return this.updateDeletedRelations(operation);
                }));
    
            }).then(() => { // remove removed entities
                return Promise.all(persistOperation.removes.map(operation => {
                    return this.delete(operation.entity);
                }));
    
            }).then(() => { // update ids
    
                persistOperation.inserts.forEach(insertOperation => {
                    const metadata = this.connection.getMetadata(insertOperation.entity.constructor);
                    insertOperation.entity[metadata.primaryColumn.name] = insertOperation.entityId;
                });
    
            });
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private updateByRelation(operation: UpdateByRelationOperation, insertOperations: InsertOperation[]) {
        let tableName: string, relationName: string, relationId: any, idColumn: string, id: any;
        const idInInserts = insertOperations.find(o => o.entity === operation.targetEntity).entityId;
        if (operation.updatedRelation.isOneToMany) {
            const metadata = this.connection.getMetadata(operation.insertOperation.entity.constructor);
            tableName = metadata.table.name;
            relationName = operation.updatedRelation.inverseRelation.name;
            relationId = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;
            idColumn = metadata.primaryColumn.name;
            id = operation.insertOperation.entityId;

        } else {
            const metadata = this.connection.getMetadata(operation.targetEntity.constructor);
            tableName = metadata.table.name;
            relationName = operation.updatedRelation.name;
            relationId = operation.insertOperation.entityId;
            idColumn = metadata.primaryColumn.name;
            id = operation.targetEntity[metadata.primaryColumn.propertyName] || idInInserts;
        }
        const query = `UPDATE ${tableName} SET ${relationName}='${relationId}' WHERE ${idColumn}='${id}'`;
        return this.connection.driver.query(query);
    }

    private update(updateOperation: UpdateOperation) {
        const entity = updateOperation.entity;
        const metadata = this.connection.getMetadata(entity.constructor);
        const values = updateOperation.columns.map(column => {
            return column.name + "='" + entity[column.propertyName] + "'";
        });

        const query = `UPDATE ${metadata.table.name} SET ${values} WHERE ${metadata.primaryColumn.name}='${metadata.getEntityId(entity)}'` ;
        return this.connection.driver.query(query);
    }

    private updateDeletedRelations(removeOperation: RemoveOperation) { // todo: check if both many-to-one deletions work too
        if (removeOperation.relation.isManyToMany || removeOperation.relation.isOneToMany) return;
        const value = removeOperation.relation.name + "=NULL";
        const query = `UPDATE ${removeOperation.metadata.table.name} SET ${value} WHERE ${removeOperation.metadata.primaryColumn.name}='${removeOperation.fromEntityId}'` ;
        return this.connection.driver.query(query);
    }

    private delete(entity: any) {
        const metadata = this.connection.getMetadata(entity.constructor);
        const query = `DELETE FROM ${metadata.table.name} WHERE ${metadata.primaryColumn.name}='${entity[metadata.primaryColumn.propertyName]}'`;
        return this.connection.driver.query(query);
    }

    private insert(entity: any) {
        const metadata = this.connection.getMetadata(entity.constructor);
        const columns = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => entity.hasOwnProperty(column.propertyName))
            .map(column => column.name);
        /*const virtualColumns = metadata.columns
         .filter(column => column.isVirtual)
         .filter(column => entity.hasOwnProperty(column.propertyName))
         .map(column => column.name);*/
        const values = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => entity.hasOwnProperty(column.propertyName))
            .map(column => "'" + entity[column.propertyName] + "'");
        /*const virtualValues = metadata.columns
         .filter(column => column.isVirtual)
         .filter(column => entity.hasOwnProperty(column.propertyName))
         .map(column => "'" + entity[column.propertyName] + "'");
         const allColumns = columns.concat(virtualColumns);
         const allVolumes = values.concat(virtualValues);*/
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

        const query = `INSERT INTO ${metadata.table.name}(${columns.concat(relationColumns).join(",")}) VALUES (${values.concat(relationValues).join(",")})`;
        return this.connection.driver.query(query);
    }

    private insertJunctions(junctionOperation: JunctionInsertOperation, insertOperations: InsertOperation[]) {
        const junctionMetadata = junctionOperation.metadata;
        const metadata1 = this.connection.getMetadata(junctionOperation.entity1.constructor);
        const metadata2 = this.connection.getMetadata(junctionOperation.entity2.constructor);
        const columns = junctionMetadata.columns.map(column => column.name);
        const id1 = junctionOperation.entity1[metadata1.primaryColumn.name] || insertOperations.find(o => o.entity === junctionOperation.entity1).entityId;
        const id2 = junctionOperation.entity2[metadata2.primaryColumn.name] || insertOperations.find(o => o.entity === junctionOperation.entity2).entityId;
        const values = [id1, id2]; // todo: order may differ, find solution (column.table to compare with entity metadata table?)

        const query = `INSERT INTO ${junctionMetadata.table.name}(${columns.join(",")}) VALUES (${values.join(",")})`;
        return this.connection.driver.query(query);
    }

    private removeJunctions(junctionOperation: JunctionRemoveOperation) {
        const junctionMetadata = junctionOperation.metadata;
        const metadata1 = this.connection.getMetadata(junctionOperation.entity1.constructor);
        const metadata2 = this.connection.getMetadata(junctionOperation.entity2.constructor);
        const columns = junctionMetadata.columns.map(column => column.name);
        const id1 = junctionOperation.entity1[metadata1.primaryColumn.name];
        const id2 = junctionOperation.entity2[metadata2.primaryColumn.name];
        const query = `DELETE FROM ${junctionMetadata.table.name} WHERE ${columns[0]}='${id1}' AND ${columns[1]}='${id2}'`;
        return this.connection.driver.query(query);
    }

}