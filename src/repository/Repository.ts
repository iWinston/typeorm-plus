import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {
    EntityPersistOperationsBuilder, PersistOperation, JunctionInsertOperation,
    InsertOperation, JunctionRemoveOperation, UpdateOperation, UpdateByRelationOperation
} from "./EntityPersistOperationsBuilder";

// todo: think how we can implement queryCount, queryManyAndCount
// todo: extract non safe methods from repository (removeById, removeByConditions)

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity> {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private _connection: Connection;
    private _metadata: EntityMetadata;
    private broadcaster: OrmBroadcaster<Entity>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection,
                metadata: EntityMetadata,
                broadcaster: OrmBroadcaster<Entity>) {
        this._connection = connection;
        this._metadata   = metadata;
        this.broadcaster = broadcaster;
    }

    // -------------------------------------------------------------------------
    // Getter Methods
    // -------------------------------------------------------------------------

    get metadata(): EntityMetadata {
        return this._metadata;
    }

    get connection(): Connection {
        return this._connection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new entity.
     */
    create(copyFrom?: any): Entity {
        if (copyFrom) {
            const transformer = new PlainObjectToNewEntityTransformer();
            return transformer.transform(copyFrom, this.metadata);
        }
        return <Entity> this.metadata.create();
    }
    
    initialize(object: any): Promise<Entity> {
        const transformer = new PlainObjectToDatabaseEntityTransformer();
        const queryBuilder = this.createQueryBuilder(this.metadata.table.name);
        return transformer.transform(object, this.metadata, queryBuilder);
    }

    merge(entity1: Entity, entity2: Entity): Entity {
        return Object.assign(this.metadata.create(), entity1, entity2);
    }

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    difference(entity1: Entity, entity2: Entity): PersistOperation {
        const builder = new EntityPersistOperationsBuilder(this.connection);
        return builder.difference(this.metadata, entity1, entity2);
    }
    
    persist(entity: Entity) {
        const promise = !this.hasId(entity) ? Promise.resolve(null) : this.initialize(entity);
        //if (!this.hasId(entity)) { // do insert
        return promise.then(dbEntity => {
            const persistOperations = this.difference(dbEntity, entity);
            // create update queries based on diff map
            return Promise.all(persistOperations.inserts.map(operation => {
                return this.insert(operation.entity).then((result: any) => {
                    operation.entityId = result.insertId;
                });
            })).then(() => { // insert junction table insertions

                return Promise.all(persistOperations.junctionInserts.map(junctionOperation => {
                    return this.insertJunctions(junctionOperation, persistOperations.inserts);
                }));
            }).then(() => { // remove junction table insertions

                return Promise.all(persistOperations.junctionRemoves.map(junctionOperation => {
                    return this.removeJunctions(junctionOperation);
                }));
                
            }).then(() => {
                
                return Promise.all(persistOperations.updatesByRelations.map(updateByRelation => {
                    this.updateByRelation(updateByRelation, persistOperations.inserts);
                }));
                
                /*return Promise.all(persistOperations.inserts.map(operation => {

                    const meta = this.connection.getMetadata(operation.entity.constructor);
                    const oneToOneManyToOneUpdates = Promise.all(meta.relations.map(relation => {
                        
                        let insertOperationUpdates: Promise<any>, updateOperationUpdates: Promise<any>;
                       
                        if (operation.entity[relation.propertyName] instanceof Array && relation.isOneToMany) {

                            insertOperationUpdates = Promise.all(persistOperations.inserts.filter(o => {
                                return operation.entity[relation.propertyName].indexOf(o.entity) !== -1;
                            }).map(o => {
                                const oMetadata = this.connection.getMetadata(o.entity.constructor);
                                const inverseRelation = relation.inverseRelation;
                                const query = `UPDATE ${oMetadata.table.name} SET ${inverseRelation.name}='${operation.entityId}' WHERE ${oMetadata.primaryColumn.name}='${o.entityId}'`;
                                return this.connection.driver.query(query);
                            }));

                            updateOperationUpdates = Promise.all(persistOperations.updates.filter(o => {
                                return operation.entity[relation.propertyName].indexOf(o.entity) !== -1;
                            }).map(o => {
                                const oMetadata = this.connection.getMetadata(o.entity.constructor);
                                const inverseRelation = relation.inverseRelation;
                                const id = operation.entity[meta.primaryColumn.name];
                                const query = `UPDATE ${oMetadata.table.name} SET ${inverseRelation.name}='${operation.entityId}' WHERE ${oMetadata.primaryColumn.name}='${id}'`;
                                return this.connection.driver.query(query);
                            }));
                            
                        } else {
                            
                            insertOperationUpdates = Promise.all(persistOperations.inserts.filter(o => {
                                return operation.entity[relation.propertyName] === o.entity; // only one-to-one and many-to-one
                            }).map(o => {
                                const query = `UPDATE ${meta.table.name} SET ${relation.name}='${o.entityId}' WHERE ${meta.primaryColumn.name}='${operation.entityId}'`;
                                return this.connection.driver.query(query);
                            }));

                            updateOperationUpdates = Promise.all(persistOperations.updates.filter(o => {
                                return operation.entity[relation.propertyName] === o.entity; // only one-to-one and many-to-one
                            }).map(o => {
                                const reverseMeta = this.connection.getMetadata(o.entity.constructor);
                                const id = o.entity[reverseMeta.primaryColumn.name];
                                const query = `UPDATE ${meta.table.name} SET ${relation.name}='${id}' WHERE ${meta.primaryColumn.name}='${operation.entityId}'`;
                                return this.connection.driver.query(query);
                            }));
                        }
                        
                        return Promise.all([insertOperationUpdates, updateOperationUpdates]);
                    }));

                    return Promise.all([oneToOneManyToOneUpdates]);
                }));*/
            }).then(() => { // perform updates

                return Promise.all(persistOperations.updates.map(updateOperation => {
                    return this.update(updateOperation);
                }));

            }).then(() => { // update ids
                
                persistOperations.inserts.forEach(insertOperation => {
                    const metadata = this.connection.getMetadata(insertOperation.entity.constructor);
                    insertOperation.entity[metadata.primaryColumn.name] = insertOperation.entityId;
                });
                
                return entity;

            });
        //} else {
            // do update
            /*return this.initialize(entity).then(dbEntity => {
                const persistOperations = this.difference(dbEntity, entity);
                // create update queries based on diff map
                return Promise.all(persistOperations.inserts.map(operation => {
                    return this.insert(operation.entity);
                }));
            });*/
        //}
        });
    }
    
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

    /*copyEntity(entity1: Entity, entity2: Entity) {
        this.metadata.columns
    }*/

    /**
     * Creates a entities from the given array of plain javascript objects. If fetchAllData param is specified then
     * entities data will be loaded from the database first, then filled with given json data.
     */
    createMany(copyFromObjects: any[]): Entity[] {
        return copyFromObjects.map(object => this.create(object));
    }

    /**
     * Checks if entity has an id.
     */
    hasId(entity: Entity): boolean {
        return entity && this.metadata.primaryColumn && entity.hasOwnProperty(this.metadata.primaryColumn.propertyName);
    }

    /**
     * Creates a new query builder that can be used to build an sql query.
     */
    createQueryBuilder(alias: string): QueryBuilder<Entity> {
        return this.connection.driver
            .createQueryBuilder<Entity>(this.connection)
            .select(alias)
            .from(this.metadata.target, alias);
    }

    /**
     * Executes query and returns raw database results.
     */
    query(query: string): Promise<any> {
        return this.connection.driver.query(query);
    }

    /**
     * Finds entities that match given conditions.
     */
    find(conditions?: Object): Promise<Entity[]> {
        const alias = this.metadata.table.name;
        const builder = this.createQueryBuilder(alias);
        Object.keys(conditions).forEach(key => builder.where(alias + "." + key + "=:" + key));
        return builder.setParameters(conditions).getResults();
    }

    /**
     * Finds one entity that matches given condition.
     */
    findOne(conditions: Object): Promise<Entity> {
        const alias = this.metadata.table.name;
        const builder = this.createQueryBuilder(alias);
        Object.keys(conditions).forEach(key => builder.where(alias + "." + key + "=:" + key));
        return builder.setParameters(conditions).getSingleResult();
    }

    /**
     * Finds entity with given id.
     */
    findById(id: any): Promise<Entity> {
        const alias = this.metadata.table.name;
        return this.createQueryBuilder(alias)
            .where(alias + "." + this.metadata.primaryColumn.name + "=:id")
            .setParameter("id", id)
            .getSingleResult();
    }

    // -------------------------------------------------------------------------
    // Persist starts
    // -------------------------------------------------------------------------

    /**
     * Saves a given entity. If entity is not inserted yet then it inserts a new entity.
     * If entity already inserted then performs its update.
     */
    //persist(entity: Entity/*, dynamicCascadeOptions?: DynamicCascadeOptions<Entity>*/): Promise<Entity> {
        // todo
      //  return Promise.resolve<Entity>(null);
        
        // if (!this.schema.isEntityTypeCorrect(entity))
        //    throw new BadEntityInstanceException(entity, this.schema.entityClass);

//        const remover     = new EntityRemover<Entity>(this.connection);
  //      const persister   = new EntityPersister<Entity>(this.connection);

       /* return remover.computeRemovedRelations(this.metadata, entity, dynamicCascadeOptions)
            .then(result => persister.persist(this.metadata, entity, dynamicCascadeOptions))
            .then(result => remover.executeRemoveOperations())
            .then(result => remover.executeUpdateInverseSideRelationRemoveIds())
            .then(result => entity);*/
   // }
    
    /*computeChangeSet(entity: Entity) {
        // if there is no primary key - there is no way to determine if object needs to be updated or insert
        // since we cannot get the target object without identifier, that's why we always do insert for such objects
        if (!this.metadata.primaryColumn)
            return this.insert(entity);
        
        // load entity from the db
        this.findById(this.metadata.getEntityId(entity)).then(dbEntity => {
            
        });
    }*/

    // -------------------------------------------------------------------------
    // Persist ends
    // -------------------------------------------------------------------------

    /**
     * Removes a given entity.
     */
    remove(entity: Entity/*, dynamicCascadeOptions?: DynamicCascadeOptions<Entity>*/): Promise<void> {
        // todo
        return Promise.resolve();
        // if (!this.schema.isEntityTypeCorrect(entity))
        //    throw new BadEntityInstanceException(entity, this.schema.entityClass);
        /*const remover = new EntityRemover<Entity>(this.connection);
        return remover.registerEntityRemoveOperation(this.metadata, this.metadata.getEntityId(entity), dynamicCascadeOptions)
            .then(results => remover.executeRemoveOperations())
            .then(results => remover.executeUpdateInverseSideRelationRemoveIds());*/
    }

    /**
     * Removes entity by a given id. Does not take care about cascade remove operations.
     */
    removeById(id: string): Promise<void> {
        const alias = this.metadata.table.name;
        return this.createQueryBuilder(alias)
            .delete()
            .where(alias + "." + this.metadata.primaryColumn.name + "=:id")
            .setParameter("id", id)
            .execute()
            .then(() => {});
    }

    /**
     * Removes entities by a given simple conditions. Does not take care about cascade remove operations.
     */
    removeByConditions(conditions: Object): Promise<void> {
        const alias = this.metadata.table.name;
        const builder = this.createQueryBuilder(alias).delete();
        Object.keys(conditions).forEach(key => builder.where(alias + "." + key + "=:" + key));
        return builder
            .setParameters(conditions)
            .execute()
            .then(() => {});
    }
    
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

}