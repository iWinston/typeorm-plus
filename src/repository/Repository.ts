import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";
import {QueryBuilder} from "../query-builder/QueryBuilder";

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
    create(): Entity {
        return <Entity> this.metadata.create();
    }

    /**
     * Checks if entity has an id.
     */
    hasId(entity: Entity): boolean {
        return entity && this.metadata.primaryColumn && entity.hasOwnProperty(this.metadata.primaryColumn.propertyName);
    }

    /**
     * Creates entity from the given json data. If fetchAllData param is specified then entity data will be
     * loaded from the database first, then filled with given json data.
     */
    createFromJson(json: any, fetchProperty?: boolean): Promise<Entity>;
    createFromJson(json: any, fetchConditions?: Object): Promise<Entity>;
    createFromJson(json: any, fetchOption?: boolean|Object): Promise<Entity> {
        return Promise.resolve<Entity>(null); // todo
       /* const creator = new EntityCreator(this.connection);
        return creator.createFromJson<Entity>(json, this.metadata, fetchOption);*/
    }

    /**
     * Creates a entities from the given array of plain javascript objects. If fetchAllData param is specified then
     * entities data will be loaded from the database first, then filled with given json data.
     */
    createManyFromJson(objects: any[], fetchProperties?: boolean[]): Promise<Entity[]>;
    createManyFromJson(objects: any[], fetchConditions?: Object[]): Promise<Entity[]>;
    createManyFromJson(objects: any[], fetchOption?: boolean[]|Object[]): Promise<Entity[]> {
        return Promise.resolve<Entity[]>(null); // todo
        /*return Promise.all(objects.map((object, key) => {
            const fetchConditions = (fetchOption && fetchOption[key]) ? fetchOption[key] : undefined;
            return this.createFromJson(object, fetchConditions);
        }));*/
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
    persist(entity: Entity/*, dynamicCascadeOptions?: DynamicCascadeOptions<Entity>*/): Promise<Entity> {
        // todo
        return Promise.resolve<Entity>(null);
        
        // if (!this.schema.isEntityTypeCorrect(entity))
        //    throw new BadEntityInstanceException(entity, this.schema.entityClass);

//        const remover     = new EntityRemover<Entity>(this.connection);
  //      const persister   = new EntityPersister<Entity>(this.connection);

       /* return remover.computeRemovedRelations(this.metadata, entity, dynamicCascadeOptions)
            .then(result => persister.persist(this.metadata, entity, dynamicCascadeOptions))
            .then(result => remover.executeRemoveOperations())
            .then(result => remover.executeUpdateInverseSideRelationRemoveIds())
            .then(result => entity);*/
    }
    
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