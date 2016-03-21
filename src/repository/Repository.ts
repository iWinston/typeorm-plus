import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {EntityPersistOperationBuilder} from "../persistment/EntityPersistOperationsBuilder";
import {PersistOperationExecutor} from "../persistment/PersistOperationExecutor";

// todo: think how we can implement queryCount, queryManyAndCount

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity> {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this repository.
     */
    private connection: Connection;

    /**
     * Entity metadata of the table with which this repository is working.
     */
    private metadata: EntityMetadata;

    /**
     * Broadcaster used to broadcast this repository events.
     */
    private broadcaster: OrmBroadcaster<Entity>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection,
                metadata: EntityMetadata,
                broadcaster: OrmBroadcaster<Entity>) {
        this.connection  = connection;
        this.metadata    = metadata;
        this.broadcaster = broadcaster;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

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
            .createQueryBuilder<Entity>()
            .select(alias)
            .from(this.metadata.target, alias);
    }

    /**
     * Creates a new entity. If fromRawEntity is given then it creates a new entity and copies all entity properties
     * from this object into a new entity (copies only properties that should be in a new entity).
     */
    create(fromRawEntity?: Object): Entity {
        if (fromRawEntity) {
            const transformer = new PlainObjectToNewEntityTransformer();
            return transformer.transform(fromRawEntity, this.metadata);
        }
        return <Entity> this.metadata.create();
    }

    /**
     * Creates a entities from the given array of plain javascript objects.
     */
    createMany(copyFromObjects: any[]): Entity[] {
        return copyFromObjects.map(object => this.create(object));
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    initialize(object: Object): Promise<Entity> {
        const transformer = new PlainObjectToDatabaseEntityTransformer();
        const queryBuilder = this.createQueryBuilder(this.metadata.table.name);
        return transformer.transform(object, this.metadata, queryBuilder);
    }

    /**
     * Merges two entities into one new entity.
     */
    merge(entity1: Entity, entity2: Entity): Entity {
        return Object.assign(this.metadata.create(), entity1, entity2);
    }

    /**
     * Persists (saves) a given entity in the database.
     */
    persist(entity: Entity) {
        const persister = new PersistOperationExecutor(this.connection);
        const promise = !this.hasId(entity) ? Promise.resolve(null) : this.initialize(entity);
        return promise.then(dbEntity => {
            const builder = new EntityPersistOperationBuilder(this.connection);
            const persistOperation = builder.buildFullPersistment(this.metadata, dbEntity, entity);
            return persister.executePersistOperation(persistOperation);
        }).then(() => entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove(entity: Entity) {
        const persister = new PersistOperationExecutor(this.connection);
        return this.initialize(entity).then(dbEntity => {
            (<any> entity)[this.metadata.primaryColumn.name] = undefined;
            const builder = new EntityPersistOperationBuilder(this.connection);
            const persistOperation = builder.buildOnlyRemovement(this.metadata, dbEntity, entity);
            return persister.executePersistOperation(persistOperation);
        }).then(() => entity);
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
     * Finds first entity that matches given conditions.
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

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Promise<any> {
        return this.connection.driver.query(query);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Promise<any> {
        let runInTransactionResult: any;
        return this.connection.driver
            .beginTransaction()
            .then(() => runInTransaction())
            .then(result => {
                runInTransactionResult = result;
                this.connection.driver.endTransaction()
            })
            .then(() => runInTransactionResult);
    }

}