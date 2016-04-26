import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {EntityPersistOperationBuilder} from "../persistment/EntityPersistOperationsBuilder";
import {PersistOperationExecutor} from "../persistment/PersistOperationExecutor";
import {EntityWithId} from "../persistment/operation/PersistOperation";
import {FindOptions, FindOptionsUtils} from "./FindOptions";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection, 
                private entityMetadatas: EntityMetadata[],
                private metadata: EntityMetadata) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if entity has an id.
     */
    hasId(entity: Entity): boolean {
        return entity &&
            this.metadata.primaryColumn &&
            entity.hasOwnProperty(this.metadata.primaryColumn.propertyName) &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== null &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== undefined;
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string): QueryBuilder<Entity> {
        // const qb = this.connection.driver.createQueryBuilder<Entity>();
        const cls: any = this.connection.driver.queryBuilderClass;
        const qb = new cls(this.connection, this.entityMetadatas);
        return qb
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
    createMany(copyFromObjects: Object[]): Entity[] {
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
     * Persists (saves) a given entity in the database. If entity does not exist in the database then it inserts it, 
     * else if entity already exist in the database then it updates it.
     */
    persist(entity: Entity): Promise<Entity> {
        let loadedDbEntity: any;
        const persister = new PersistOperationExecutor(this.connection, this.entityMetadatas);
        const builder = new EntityPersistOperationBuilder(this.connection, this.entityMetadatas);
        const allPersistedEntities = this.extractObjectsById(entity, this.metadata);
        const promise: Promise<Entity> = !this.hasId(entity) ? Promise.resolve<Entity|null>(null) : this.initialize(entity);
        return promise
            .then(dbEntity => {
                loadedDbEntity = dbEntity;
                const entityWithIds = dbEntity ? this.extractObjectsById(dbEntity, this.metadata) : [];
                return this.findNotLoadedIds(entityWithIds, allPersistedEntities);
            }) // need to find db entities that were not loaded by initialize method
            .then(allDbEntities => {
                const persistOperation = builder.buildFullPersistment(this.metadata, loadedDbEntity, entity, allDbEntities, allPersistedEntities);
                return persister.executePersistOperation(persistOperation);
            }).then(() => entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove(entity: Entity): Promise<Entity> {
        const persister = new PersistOperationExecutor(this.connection, this.entityMetadatas);
        return this.initialize(entity).then(dbEntity => {
            (<any> entity)[this.metadata.primaryColumn.name] = undefined;
            const builder = new EntityPersistOperationBuilder(this.connection, this.entityMetadatas);
            const dbEntities = this.extractObjectsById(dbEntity, this.metadata);
            const allPersistedEntities = this.extractObjectsById(entity, this.metadata);
            const persistOperation = builder.buildOnlyRemovement(this.metadata, dbEntity, entity, dbEntities, allPersistedEntities);
            return persister.executePersistOperation(persistOperation);
        }).then(() => entity);
    }

    /**
     * Finds all entities.
     */
    find(): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions: Object): Promise<Entity[]>;

    /**
     * Finds entities with .
     */
    find(options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions: Object, options: FindOptions): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity[]> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getResults();
    }

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditions: Object): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditions: Object, options: FindOptions): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     */
    findAndCount(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<[ Entity[], number ]> {
        const qb = this.createFindQueryBuilder(conditionsOrFindOptions, options);
        return qb.getResultsAndCount();
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions: Object): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions: Object, options: FindOptions): Promise<Entity>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions): Promise<Entity> {
        return this.createFindQueryBuilder(conditionsOrFindOptions, options)
            .getSingleResult();
    }

    /**
     * Finds entity with given id.
     */
    findById(id: any, options?: FindOptions): Promise<Entity> {
        return this.createFindQueryBuilder({ [this.metadata.primaryColumn.name]: id }, options)
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
                return this.connection.driver.endTransaction();
            })
            .then(() => runInTransactionResult);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createFindQueryBuilder(conditionsOrFindOptions?: Object|FindOptions, options?: FindOptions) {
        const findOptions = FindOptionsUtils.isFindOptions(conditionsOrFindOptions) ? conditionsOrFindOptions : <FindOptions> options;
        const conditions = FindOptionsUtils.isFindOptions(conditionsOrFindOptions) ? undefined : conditionsOrFindOptions;

        const alias = findOptions ? findOptions.alias : this.metadata.table.name;
        const qb = this.createQueryBuilder(alias);
        if (findOptions) {
            FindOptionsUtils.applyOptionsToQueryBuilder(qb, findOptions);
        }
        if (conditions) {
            Object.keys(conditions).forEach(key => {
                const name = key.indexOf(".") === -1 ? alias + "." + key : key;
                qb.andWhere(name + "=:" + key);
            });
            qb.addParameters(conditions);
        }
        return qb;
    }

    /**
     * When ORM loads dbEntity it uses joins to load all entity dependencies. However when dbEntity is newly persisted
     * to the db, but uses already exist in the db relational entities, those entities cannot be loaded, and will
     * absent in dbEntities. To fix it, we need to go throw all persistedEntities we have, find out those which have
     * ids, check if we did not load them yet and try to load them. This algorithm will make sure that all dbEntities
     * are loaded. Further it will help insert operations to work correctly.
     */
    private findNotLoadedIds(dbEntities: EntityWithId[], persistedEntities: EntityWithId[]): Promise<EntityWithId[]> {
        const missingDbEntitiesLoad = persistedEntities
            .filter(entityWithId => entityWithId.id !== null && entityWithId.id !== undefined)
            .filter(entityWithId => !dbEntities.find(dbEntity => dbEntity.entity.constructor === entityWithId.entity.constructor && dbEntity.id === entityWithId.id))
            .map(entityWithId => {
                // const metadata = this.connection.getEntityMetadata(entityWithId.entity.constructor);
                const metadata = this.entityMetadatas.find(metadata => metadata.target === entityWithId.entity.constructor);
                const repository = this.connection.getRepository(entityWithId.entity.constructor);
                return repository.findById(entityWithId.id).then(loadedEntity => {
                    if (!loadedEntity) return undefined;

                    return <EntityWithId> {
                        id: (<any> loadedEntity)[metadata.primaryColumn.name],
                        entity: loadedEntity
                    };
                });
            });

        return Promise.all<EntityWithId>(missingDbEntitiesLoad).then(missingDbEntities => {
            return dbEntities.concat(missingDbEntities.filter(dbEntity => !!dbEntity));
        });
    }

    /**
     * Extracts unique objects from given entity and all its downside relations.
     */
    private extractObjectsById(entity: any, metadata: EntityMetadata, entityWithIds: EntityWithId[] = []): EntityWithId[] {
        metadata.relations
            .filter(relation => !!entity[relation.propertyName])
            .forEach(relation => {
                const relMetadata = relation.relatedEntityMetadata;
                const value = entity[relation.propertyName];
                if (value instanceof Array) {
                    value.forEach((subEntity: any) => this.extractObjectsById(subEntity, relMetadata, entityWithIds));
                } else {
                    this.extractObjectsById(value, relMetadata, entityWithIds);
                }
            });
        
        if (!entityWithIds.find(entityWithId => entityWithId.entity === entity)) {
            entityWithIds.push({
                id: entity[metadata.primaryColumn.name],
                entity: entity
            });
        }
        
        return entityWithIds;
    }

}