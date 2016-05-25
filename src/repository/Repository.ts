import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {EntityPersistOperationBuilder} from "../persistment/EntityPersistOperationsBuilder";
import {PersistOperationExecutor} from "../persistment/PersistOperationExecutor";
import {EntityWithId} from "../persistment/operation/PersistOperation";
import {FindOptions, FindOptionsUtils} from "./FindOptions";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Broadcaster} from "../subscriber/Broadcaster";
import {Driver} from "../driver/Driver";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity> {
    
    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    protected driver: Driver;
    protected broadcaster: Broadcaster;
    protected persistOperationExecutor: PersistOperationExecutor;
    protected entityPersistOperationBuilder: EntityPersistOperationBuilder;
    protected plainObjectToEntityTransformer: PlainObjectToNewEntityTransformer;
    protected plainObjectToDatabaseEntityTransformer: PlainObjectToDatabaseEntityTransformer<Entity>;
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected entityMetadatas: EntityMetadataCollection,
                protected metadata: EntityMetadata) {
        this.driver = connection.driver;
        this.broadcaster = new Broadcaster(entityMetadatas, connection.eventSubscribers, connection.entityListeners); // todo: inject broadcaster from connection
        this.persistOperationExecutor = new PersistOperationExecutor(connection.driver, entityMetadatas, this.broadcaster);
        this.entityPersistOperationBuilder = new EntityPersistOperationBuilder(entityMetadatas);
        this.plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer();
        this.plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if entity has an id.
     */
    hasId(entity: Entity): boolean {
        return entity &&
            entity.hasOwnProperty(this.metadata.primaryColumn.propertyName) &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== null &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== undefined &&
            (<any> entity)[this.metadata.primaryColumn.propertyName] !== "";
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string): QueryBuilder<Entity> {
        return new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster)
            .select(alias)
            .from(this.metadata.target, alias);
    }

    /**
     * Creates a new entity. If fromRawEntity is given then it creates a new entity and copies all entity properties
     * from this object into a new entity (copies only properties that should be in a new entity).
     */
    create(fromRawEntity?: Object): Entity {
        if (fromRawEntity)
            return this.addLazyProperties(this.plainObjectToEntityTransformer.transform(fromRawEntity, this.metadata));

        return <Entity> this.addLazyProperties(this.metadata.create());
    }

    /**
     * Creates entities from a given array of plain javascript objects.
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
        const queryBuilder = this.createQueryBuilder(this.metadata.table.name);
        return this.plainObjectToDatabaseEntityTransformer.transform(object, this.metadata, queryBuilder);
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
        let loadedDbEntity: any, allPersistedEntities: EntityWithId[];
        return Promise.resolve() // resolve is required because need to wait until lazy relations loaded
            .then(() => {
                return this.extractObjectsById(entity, this.metadata);
            })
            .then(allPersisted => {
                allPersistedEntities = allPersisted;
                if (!this.hasId(entity))
                    return Promise.resolve<Entity|null>(null);

                return this.initialize(entity);
            })
            .then(dbEntity => {
                loadedDbEntity = dbEntity;
                return dbEntity ? this.extractObjectsById(dbEntity, this.metadata) : [];
            }).then(entityWithIds => {
                return this.findNotLoadedIds(entityWithIds, allPersistedEntities);
            }) // need to find db entities that were not loaded by initialize method
            .then(allDbEntities => {
                return this.entityPersistOperationBuilder.buildFullPersistment(this.metadata, loadedDbEntity, entity, allDbEntities, allPersistedEntities);
            })
            .then(persistOperation => {
                return this.persistOperationExecutor.executePersistOperation(persistOperation);
            })
            .then(() => entity);
    }

    /**
     * Removes a given entity from the database.
     */
    remove(entity: Entity): Promise<Entity> {
        let dbEntity: Entity;
        return this
            .initialize(entity)
            .then(dbEnt => {
                dbEntity = dbEnt;
                (<any> entity)[this.metadata.primaryColumn.name] = undefined;
                return Promise.all<any>([
                    this.extractObjectsById(dbEntity, this.metadata),
                    this.extractObjectsById(entity, this.metadata)
                ]);
            })
            // .then(([dbEntities, allPersistedEntities]: [EntityWithId[], EntityWithId[]]) => {
            .then(results => {
                const persistOperation = this.entityPersistOperationBuilder.buildOnlyRemovement(this.metadata, dbEntity, entity, results[0], results[1]);
                return this.persistOperationExecutor.executePersistOperation(persistOperation);
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
    findOneById(id: any, options?: FindOptions): Promise<Entity> {
        return this.createFindQueryBuilder({ [this.metadata.primaryColumn.name]: id }, options)
            .getSingleResult();
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string): Promise<any> {
        return this.driver.query(query);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     */
    transaction(runInTransaction: () => Promise<any>): Promise<any> {
        let runInTransactionResult: any;
        return this.driver
            .beginTransaction()
            .then(() => runInTransaction())
            .then(result => {
                runInTransactionResult = result;
                return this.driver.endTransaction();
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
                const metadata = this.entityMetadatas.findByTarget(entityWithId.entity.constructor);
                const repository = this.connection.getRepository(entityWithId.entity.constructor);
                return repository.findOneById(entityWithId.id).then(loadedEntity => {
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
    private extractObjectsById(entity: any, metadata: EntityMetadata, entityWithIds: EntityWithId[] = []): Promise<EntityWithId[]> {
        const promises = metadata.relations
            // .filter(relation => !!entity[relation.propertyName])
            .map(relation => {
                const relMetadata = relation.inverseEntityMetadata;
                // const value = ;

                const value = (entity[relation.propertyName] instanceof Promise && relation.isLazy) ? entity["__" + relation.propertyName + "__"] : entity[relation.propertyName];
                if (!value)
                    return undefined;
                
                if (value instanceof Array) {
                    const subPromises = value.map((subEntity: any) => {
                        return this.extractObjectsById(subEntity, relMetadata, entityWithIds);
                    });
                    return Promise.all(subPromises);

                /*} else if (value instanceof Promise && relation.isLazy) {
                    
                    return value.then((resolvedValue: any) => { // todo: duplicate logic

                        if (resolvedValue && resolvedValue instanceof Array) {
                            const promises = resolvedValue.map((subEntity: any) => {
                                return this.extractObjectsById(subEntity, relMetadata, entityWithIds);
                            });
                            return Promise.all(promises);
                            
                        } else if (resolvedValue) {
                            return this.extractObjectsById(resolvedValue, relMetadata, entityWithIds);
                        }
                        
                    });*/
                    
                } else {
                    return this.extractObjectsById(value, relMetadata, entityWithIds);
                }
            })
            .filter(result => !!result);
        
        return Promise.all<any>(promises).then(() => {
            if (!entityWithIds.find(entityWithId => entityWithId.entity === entity)) {
                entityWithIds.push({
                    id: entity[metadata.primaryColumn.name],
                    entity: entity
                });
            }

            return entityWithIds;
        });
    }

    // todo: duplication
    private addLazyProperties(entity: any) {
        const metadata = this.entityMetadatas.findByTarget(entity.constructor);
        metadata.relations
            .filter(relation => relation.isLazy)
            .forEach(relation => {
                const index = "__" + relation.propertyName + "__";

                Object.defineProperty(entity, relation.propertyName, {
                    get: () => {
                        if (entity[index])
                            return Promise.resolve(entity[index]);
                        // find object metadata and try to load
                        return new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster)
                            .select(relation.propertyName)
                            .from(relation.target, relation.propertyName) // todo: change `id` after join column implemented
                            .where(relation.propertyName + ".id=:" + relation.propertyName + "Id")
                            .setParameter(relation.propertyName + "Id", entity[index])
                            .getSingleResult()
                            .then(result => {
                                entity[index] = result;
                                return entity[index];
                            });
                    },
                    set: (promise: Promise<any>) => {
                        if (promise instanceof Promise) {
                            promise.then(result => entity[index] = result);
                        } else {
                            entity[index] = promise;
                        }
                    }
                });
            });
        return entity;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    static ownsMetadata(repository: Repository<any>, metadata: EntityMetadata) {
        return repository.metadata === metadata;
    }

}