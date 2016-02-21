import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";
import {QueryBuilder} from "../driver/query-builder/QueryBuilder";
import {DynamicCascadeOptions} from "./cascade/CascadeOption";
import {EntityCreator} from "./creator/EntityCreator";

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
        const creator = new EntityCreator(this.connection);
        return creator.createFromJson<Entity>(json, this.metadata, fetchOption);
    }

    /**
     * Creates a entities from the given array of plain javascript objects. If fetchAllData param is specified then
     * entities data will be loaded from the database first, then filled with given json data.
     */
    createManyFromJson(objects: any[], fetchProperties?: boolean[]): Promise<Entity[]>;
    createManyFromJson(objects: any[], fetchConditions?: Object[]): Promise<Entity[]>;
    createManyFromJson(objects: any[], fetchOption?: boolean[]|Object[]): Promise<Entity[]> {
        return Promise.all(objects.map((object, key) => {
            const fetchConditions = (fetchOption && fetchOption[key]) ? fetchOption[key] : undefined;
            return this.createFromJson(object, fetchConditions);
        }));
    }

    /**
     * Creates a new query builder that can be used to build an sql query.
     */
    createQueryBuilder(alias?: string): QueryBuilder {
        const queryBuilder = this.connection.driver.createQueryBuilder();
        queryBuilder.getTableNameFromEntityCallback = entity => this.getTableNameFromEntityCallback(entity);
        if (alias)
            queryBuilder.select("*").from(this.metadata.target, alias);

        return queryBuilder;
    }

    /**
     * Executes query. Expects query will return object in Entity format and creates Entity object from that result.
     */
    queryOne(query: string): Promise<Entity> {
        return this.connection.driver
            .query<any[]>(query)
            .then(results => this.createFromJson(results[0]))
            .then(entity => {
                this.broadcaster.broadcastAfterLoaded(entity);
                return entity;
            });
    }

    /**
     * Executes query. Expects query will return objects in Entity format and creates Entity objects from that result.
     */
    queryMany(query: string): Promise<Entity[]> {
        return this.connection.driver
            .query<any[]>(query)
            .then(results => this.createManyFromJson(results))
            .then(entities => {
                this.broadcaster.broadcastAfterLoadedAll(entities);
                return entities;
            });
    }

    /**
     * Executes query and returns raw result.
     */
    query(query: string): Promise<any> {
        return this.connection.driver.query(query);
    }

    /**
     * Gives number of rows found by a given query.
     */
    queryCount(query: any): Promise<number> {
        return this.connection.driver
            .query(query)
            .then(result => parseInt(result));
    }

    /**
     * Finds entities that match given conditions.
     */
    find(conditions?: Object): Promise<Entity[]> {
        const builder = this.createQueryBuilder("entity");
        Object.keys(conditions).forEach(key => {
            builder.where("entity." + key + "=:" + key).setParameter(key, (<any> conditions)[key]);
        });
        return this.queryMany(builder.getSql());
    }

    /**
     * Finds one entity that matches given condition.
     */
    findOne(conditions: Object): Promise<Entity> {
        const builder = this.createQueryBuilder("entity");
        Object.keys(conditions).forEach(key => {
            builder.where("entity." + key + "=:" + key).setParameter(key, (<any> conditions)[key]);
        });
        return this.queryOne(builder.getSql());
    }

    /**
     * Finds entity with given id.
     */
    findById(id: any): Promise<Entity> {
        const builder = this.createQueryBuilder("entity")
            .where("entity." + this.metadata.primaryColumn.name + "=:id")
            .setParameter("id", id);
        

        return this.queryOne(builder.getSql());
    }

    // -------------------------------------------------------------------------
    // Persist starts
    // -------------------------------------------------------------------------

    /**
     * Saves a given entity. If entity is not inserted yet then it inserts a new entity.
     * If entity already inserted then performs its update.
     */
    persist(entity: Entity, dynamicCascadeOptions?: DynamicCascadeOptions<Entity>): Promise<Entity> {
        
        
        
        // if (!this.schema.isEntityTypeCorrect(entity))
        //    throw new BadEntityInstanceException(entity, this.schema.entityClass);

//        const remover     = new EntityRemover<Entity>(this.connection);
  //      const persister   = new EntityPersister<Entity>(this.connection);

        return remover.computeRemovedRelations(this.metadata, entity, dynamicCascadeOptions)
            .then(result => persister.persist(this.metadata, entity, dynamicCascadeOptions))
            .then(result => remover.executeRemoveOperations())
            .then(result => remover.executeUpdateInverseSideRelationRemoveIds())
            .then(result => entity);
    }
    
    computeChangeSet(entity: Entity) {
        // if there is no primary key - there is no way to determine if object needs to be updated or insert
        // since we cannot get the target object without identifier, that's why we always do insert for such objects
        if (!this.metadata.primaryColumn)
            return this.insert(entity);
        
        // load entity from the db
        this.findById(this.metadata.getEntityId(entity)).then(dbEntity => {
            
        });
    }

    insert(entity: Entity) {
        
    }

    // -------------------------------------------------------------------------
    // Persist ends
    // -------------------------------------------------------------------------

    /**
     * Removes a given entity.
     */
    remove(entity: Entity, dynamicCascadeOptions?: DynamicCascadeOptions<Entity>): Promise<void> {
        // if (!this.schema.isEntityTypeCorrect(entity))
        //    throw new BadEntityInstanceException(entity, this.schema.entityClass);

        const remover = new EntityRemover<Entity>(this.connection);
        return remover.registerEntityRemoveOperation(this.metadata, this.metadata.getEntityId(entity), dynamicCascadeOptions)
            .then(results => remover.executeRemoveOperations())
            .then(results => remover.executeUpdateInverseSideRelationRemoveIds());
    }

    /**
     * Removes entity by a given id.
     */
    removeById(id: string): Promise<void> {
        const builder = this.createQueryBuilder("entity")
            .delete()
            .where("entity." + this.metadata.primaryColumn.name + "=:id")
            .setParameter("id", id);

        return this.query(builder.getSql());
    }

    /**
     * Removes entities by a given simple conditions.
     */
    removeByConditions(conditions: Object): Promise<any> {
        const builder = this.createQueryBuilder("entity").delete();
        Object.keys(conditions).forEach(key => {
            builder.where("entity." + key + "=:" + key).setParameter(key, (<any> conditions)[key]);
        });
        return this.query(builder.getSql());
    }

    /**
     * Finds entities by given criteria and returns them with the total number of
     */
    queryManyAndCount(query: string, countQuery: string): Promise<{ entities: Entity[] }> {
        return Promise.all<any>([
            this.queryMany(query),
            this.queryCount(countQuery)
        ]).then(([entities, count]) => {
            return { entities: <Entity[]> entities, count: <number> count };
        });
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /*private dbObjectToEntity(dbObject: any): Promise<Entity> {
        const hydrator = new EntityHydrator<Entity>(this.connection);
        return hydrator.hydrate(this.metadata, dbObject, joinFields);
    }*/

    private getTableNameFromEntityCallback(entity: Function) {
        const metadata = this.connection.getMetadata(entity);
        // todo throw exception if metadata is missing
        return metadata.table.name;
    }

}