import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {ColumnMetadata} from "../metadata-builder/metadata/ColumnMetadata";
import {RelationMetadata} from "../metadata-builder/metadata/RelationMetadata";
import {EntityPersistOperationsBuilder} from "./EntityPersistOperationsBuilder";

// todo: think how we can implement queryCount, queryManyAndCount
// todo: extract non safe methods from repository (removeById, removeByConditions)

interface RelationDifference {
    value: any;
    relation: RelationMetadata;
}

export interface EntityDifferenceMap {
    entity: any;
    columns: ColumnMetadata[];
    changedRelations: RelationDifference[];
    removedRelations: RelationDifference[];
    addedRelations: RelationDifference[];
}

interface EntityWithId {
    id: any;
    entity: any;
}

interface UpdateOperation {
    entity: any;
    columns: ColumnMetadata[];
}

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

    /**
     * Finds columns and relations from entity2 which does not exist or does not match in entity1.
     */
    difference(entity1: Entity, entity2: Entity): EntityDifferenceMap[] {
        const builder = new EntityPersistOperationsBuilder();
        return builder.difference(this.metadata, entity1, entity2);
    }
    
    findDifference(e1: any, e2: any, metadata: EntityMetadata, diffMaps: EntityDifferenceMap[]) {
        const diffColumns = metadata.columns
            .filter(column => !column.isVirtual)
            .filter(column => e1[column.propertyName] !== e2[column.propertyName]);

        const changedRelations = metadata.relations
            .filter(relation => relation.isOneToOne || relation.isManyToOne)
            .filter(relation => e1[relation.propertyName] && e2[relation.propertyName])
            .filter(relation => {
                const relationId = relation.relatedEntityMetadata.primaryColumn.name;
                return e1[relation.propertyName][relationId] !== e2[relation.propertyName][relationId];
            })
            .map(relation => ({ value: e2[relation.propertyName], relation: relation }));

        const removedRelations = metadata.relations
            .filter(relation => relation.isOneToOne || relation.isManyToOne)
            .filter(relation => e1[relation.propertyName] && !e2[relation.propertyName])
            .map(relation => ({ value: e2[relation.propertyName], relation: relation }));

        const addedRelations = metadata.relations
            .filter(relation => relation.isOneToOne || relation.isManyToOne)
            .filter(relation => !e1[relation.propertyName] && e2[relation.propertyName])
            .map(relation => ({ value: e2[relation.propertyName], relation: relation }));

        const addedManyRelations = metadata.relations
            .filter(relation => relation.isManyToMany || relation.isOneToMany)
            .filter(relation => e2[relation.propertyName] instanceof Array)
            .map(relation => {
                const relationId = relation.relatedEntityMetadata.primaryColumn.name;
                return e2[relation.propertyName].filter((e2Item: any) => {
                    if (!e1[relation.propertyName]) return false;
                    return !e1[relation.propertyName].find((e1Item: any) => e1Item[relationId] === e2Item[relationId]);
                }).map((e2Item: any) => {
                    return { value: e2Item, relation: relation };
                });
            }).reduce((a: EntityDifferenceMap[], b: EntityDifferenceMap[]) => a.concat(b), []);
        
        const removedManyRelations = metadata.relations
            .filter(relation => relation.isManyToMany || relation.isOneToMany)
            .filter(relation => e2[relation.propertyName] instanceof Array)
            .map(relation => {
                const relationId = relation.relatedEntityMetadata.primaryColumn.name;
                return e1[relation.propertyName].filter((e1Item: any) => {
                    if (!e2[relation.propertyName]) return false;
                    return !e2[relation.propertyName].find((e2Item: any) => e2Item[relationId] === e1Item[relationId]);
                }).map((e1Item: any) => {
                    return { value: e1Item, relation: relation };
                });
            }).reduce((a: EntityDifferenceMap[], b: EntityDifferenceMap[]) => a.concat(b), []);

        metadata.relations
            .filter(relation => e2[relation.propertyName])
            .filter(relation => relation.isOneToOne || relation.isManyToOne)
            .forEach(relation => {
                const property = relation.propertyName;
                this.findDifference(e1[property] || {}, e2[property], relation.relatedEntityMetadata, diffMaps);
            });

        metadata.relations
            .filter(relation => /*e1[relation.propertyName] && */e2[relation.propertyName] instanceof Array)
            .filter(relation => relation.isManyToMany || relation.isOneToMany)
            .forEach(relation => {
                const relationId = relation.relatedEntityMetadata.primaryColumn.name;
                const e1Items = e1[relation.propertyName] || [];
                e2[relation.propertyName].map((e2Item: any) => {
                    const e1Item = e1Items.find((e1Item: any) => e1Item[relationId] === e2Item[relationId]);
                    this.findDifference(e1Item || {}, e2Item, relation.relatedEntityMetadata, diffMaps);
                });
            });

        if (diffColumns.length > 0 || changedRelations.length > 0 || removedRelations.length > 0 || addedRelations.length > 0)
            diffMaps.push({
                entity: e2,
                columns: diffColumns,
                changedRelations: changedRelations,
                removedRelations: removedRelations.concat(removedManyRelations),
                addedRelations: addedRelations.concat(addedManyRelations)
            });
    }
    
    persist(entity: Entity) {
        if (!this.hasId(entity)) {
            // do insert
        } else {
            // do update
            this.initialize(entity)
                .then(dbEntity => {
                    const diffMap = this.difference(dbEntity, entity);
                    // create update queries based on diff map
                });
        }
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