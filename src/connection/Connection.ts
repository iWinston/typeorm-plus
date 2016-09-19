import {Driver} from "../driver/Driver";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {ObjectType} from "../common/ObjectType";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {EntityManager} from "../entity-manager/EntityManager";
import {importClassesFromDirectories, importJsonsFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {getMetadataArgsStorage, getFromContainer} from "../index";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {NoConnectionForRepositoryError} from "./error/NoConnectionForRepositoryError";
import {CannotImportAlreadyConnectedError} from "./error/CannotImportAlreadyConnectedError";
import {CannotCloseNotConnectedError} from "./error/CannotCloseNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "./error/CannotConnectAlreadyConnectedError";
import {ReactiveRepository} from "../repository/ReactiveRepository";
import {ReactiveEntityManager} from "../entity-manager/ReactiveEntityManager";
import {TreeRepository} from "../repository/TreeRepository";
import {TreeReactiveRepository} from "../repository/TreeReactiveRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {NamingStrategyNotFoundError} from "./error/NamingStrategyNotFoundError";
import {RepositoryNotTreeError} from "./error/RepositoryNotTreeError";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";
import {CannotSyncNotConnectedError} from "./error/CannotSyncNotConnectedError";
import {CannotUseNamingStrategyNotConnectedError} from "./error/CannotUseNamingStrategyNotConnectedError";
import {Broadcaster} from "../subscriber/Broadcaster";
import {CannotGetEntityManagerNotConnectedError} from "./error/CannotGetEntityManagerNotConnectedError";
import {LazyRelationsWrapper} from "../repository/LazyRelationsWrapper";
import {SpecificRepository} from "../repository/SpecificRepository";
import {SpecificReactiveRepository} from "../repository/ReactiveSpecificRepository";
import {RepositoryAggregator} from "../repository/RepositoryAggregator";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {Logger} from "../logger/Logger";

/**
 * A single connection instance to the database. 
 * Each connection has its own entity manager, repositories, broadcaster and entity metadatas.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Connection name.
     */
    public readonly name: string;

    /**
     * Database driver used by this connection.
     */
    public readonly driver: Driver;

    /**
     * Logger used to log orm events.
     */
    public readonly logger: Logger;

    /**
     * All entity metadatas that are registered for this connection.
     */
    public readonly entityMetadatas = new EntityMetadataCollection();

    /**
     * Used to broadcast connection events.
     */
    public readonly broadcaster: Broadcaster;

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Gets EntityManager of this connection.
     */
    private readonly _entityManager: EntityManager;

    /**
     * Gets ReactiveEntityManager of this connection.
     */
    private readonly _reactiveEntityManager: ReactiveEntityManager;

    /**
     * Stores all registered repositories.
     */
    private readonly repositoryAggregators: RepositoryAggregator[] = [];

    /**
     * Entity listeners that are registered for this connection.
     */
    private readonly entityListeners: EntityListenerMetadata[] = [];

    /**
     * Entity subscribers that are registered for this connection.
     */
    private readonly entitySubscribers: EntitySubscriberInterface<any>[] = [];

    /**
     * Registered entity classes to be used for this connection.
     */
    private readonly entityClasses: Function[] = [];

    /**
     * Registered entity schemas to be used for this connection.
     */
    private readonly entitySchemas: EntitySchema[] = [];

    /**
     * Registered subscriber classes to be used for this connection.
     */
    private readonly subscriberClasses: Function[] = [];

    /**
     * Registered naming strategy classes to be used for this connection.
     */
    private readonly namingStrategyClasses: Function[] = [];

    /**
     * Naming strategy to be used in this connection.
     */
    private usedNamingStrategy: Function|string;

    /**
     * Indicates if connection has been done or not.
     */
    private _isConnected = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, driver: Driver, logger: Logger) {
        this.name = name;
        this.driver = driver;
        this.logger = logger;
        this._entityManager = this.createEntityManager();
        this._reactiveEntityManager = this.createReactiveEntityManager();
        this.broadcaster = this.createBroadcaster();
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Indicates if connection to the database already established for this connection.
     */
    get isConnected() {
        return this._isConnected;
    }

    /**
     * Gets entity manager that allows to perform repository operations with any entity in this connection.
     */
    get entityManager() {
        if (!this.isConnected)
            throw new CannotGetEntityManagerNotConnectedError(this.name);
        
        return this._entityManager;
    }

    /**
     * Gets entity manager that allows to perform repository operations with any entity in this connection.
     * This version of entity manager is reactive - works with Observables instead of Promises.
     */
    get reactiveEntityManager() {
        if (!this.isConnected)
            throw new CannotGetEntityManagerNotConnectedError(this.name);
        
        return this._reactiveEntityManager;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);

        // connect to the database via its driver
        await this.driver.connect();

        // build all metadatas registered in the current connection
        this.buildMetadatas();

        // set connected status for the current connection
        this._isConnected = true;
        
        return this;
    }

    /**
     * Closes connection with the database.
     * Once connection is closed, you cannot use repositories and perform any operations except
     * opening connection again.
     */
    async close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotCloseNotConnectedError(this.name);

        await this.driver.disconnect();
        this._isConnected = false;
    }

    /**
     * Drops the database and all its data.
     */
    async dropDatabase(): Promise<void> {
        const queryRunner = await this.driver.createQueryRunner();
        await queryRunner.beginTransaction();
        try {
            await queryRunner.clearDatabase();
            await queryRunner.commitTransaction();
            await queryRunner.release();

        } catch (error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw error;
        }
    }

    /**
     * Creates database schema for all entities registered in this connection.
     *
     * @param dropBeforeSync If set to true then it drops the database with all its tables and data
     */
    async syncSchema(dropBeforeSync: boolean = false): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotSyncNotConnectedError(this.name));

        if (dropBeforeSync)
            await this.dropDatabase();

        await this.createSchemaBuilder().build();
    }

    /**
     * Imports entities from the given paths (directories) and registers them in the current connection.
     */
    importEntitiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entity schemas from the given paths (directories) and registers them in the current connection.
     */
    importEntitySchemaFromDirectories(paths: string[]): this {
        this.importEntitySchemas(importJsonsFromDirectories(paths));
        return this;
    }

    /**
     * Imports subscribers from the given paths (directories) and registers them in the current connection.
     */
    importSubscribersFromDirectories(paths: string[]): this {
        this.importSubscribers(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports naming strategies from the given paths (directories) and registers them in the current connection.
     */
    importNamingStrategiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entities and registers them in the current connection.
     */
    importEntities(entities: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entities", this.name);

        entities.forEach(cls => this.entityClasses.push(cls));
        return this;
    }

    /**
     * Imports schemas and registers them in the current connection.
     */
    importEntitySchemas(schemas: EntitySchema[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("schemas", this.name);

        schemas.forEach(schema => this.entitySchemas.push(schema));
        return this;
    }

    /**
     * Imports subscribers and registers them in the current connection.
     */
    importSubscribers(subscriberClasses: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entity subscribers", this.name);

        subscriberClasses.forEach(cls => this.subscriberClasses.push(cls));
        return this;
    }

    /**
     * Imports naming strategies and registers them in the current connection.
     */
    importNamingStrategies(strategies: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("naming strategies", this.name);

        strategies.forEach(cls => this.namingStrategyClasses.push(cls));
        return this;
    }

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(name: string): this;

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(strategy: Function): this;

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(strategyClassOrName: string|Function): this {
        if (this.isConnected)
            throw new CannotUseNamingStrategyNotConnectedError(this.name);

        this.usedNamingStrategy = strategyClassOrName;
        return this;
    }

    /**
     * Gets the entity metadata of the given entity class.
     */
    getMetadata(entity: Function): EntityMetadata;

    /**
     * Gets the entity metadata of the given entity name.
     */
    getMetadata(entity: string): EntityMetadata;

    /**
     Gets entity metadata for the given entity class or schema name.
     */
    getMetadata(entity: Function|string): EntityMetadata {
        return this.entityMetadatas.findByTarget(entity);
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ObjectType<Entity>): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityName: string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {
        return this.findRepositoryAggregator(entityClassOrName).repository;
    }

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureTable decorator.
     */
    getTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureTable decorator.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureTable decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {
        const repository = this.findRepositoryAggregator(entityClassOrName).treeRepository;
        if (!repository)
            throw new RepositoryNotTreeError(entityClassOrName);
        return repository;
    }

    /**
     * Gets specific repository for the given entity class.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     */
    getSpecificRepository<Entity>(entityClass: ObjectType<Entity>): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     */
    getSpecificRepository<Entity>(entityName: string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity> {
        return this.findRepositoryAggregator(entityClassOrName).specificRepository;
    }

    /**
     * Gets reactive repository for the given entity class.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getReactiveRepository<Entity>(entityClass: ObjectType<Entity>): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity name.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getReactiveRepository<Entity>(entityName: string): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity class or name.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getReactiveRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): ReactiveRepository<Entity> {
        return this.findRepositoryAggregator(entityClassOrName).reactiveRepository;
    }

    /**
     * Gets reactive tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureTable decorator.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getReactiveTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeReactiveRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity name.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureTable decorator.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getReactiveTreeRepository<Entity>(entityName: string): TreeReactiveRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureTable decorator.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getReactiveTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeReactiveRepository<Entity> {
        const repository = this.findRepositoryAggregator(entityClassOrName).treeReactiveRepository;
        if (!repository)
            throw new RepositoryNotTreeError(entityClassOrName);
        return repository;
    }

    /**
     * Gets specific repository for the given entity class.
     * SpecificReactiveRepository is a special repository that contains specific and non standard repository methods.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getSpecificReactiveRepository<Entity>(entityClass: ObjectType<Entity>): SpecificReactiveRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * SpecificReactiveRepository is a special repository that contains specific and non standard repository methods.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getSpecificReactiveRepository<Entity>(entityName: string): SpecificReactiveRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificReactiveRepository is a special repository that contains specific and non standard repository methods.
     * Reactive repositories has same functionality as regular repositories,
     * the only difference is that reactive repository methods return Observable instead of Promise.
     */
    getSpecificReactiveRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificReactiveRepository<Entity> {
        const repositoryAggregator = this.findRepositoryAggregator(entityClassOrName);
        return repositoryAggregator.specificReactiveRepository;
    }

    /**
     * Creates a new entity manager with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createEntityManagerWithSingleDatabaseConnection() {
        return new EntityManager(this, true);
    }

    /**
     * Creates a new reactive entity manager with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createReactiveEntityManagerWithSingleDatabaseConnection() {
        return new ReactiveEntityManager(this, true);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Finds repository aggregator of the given entity class or name.
     */
    protected findRepositoryAggregator(entityClassOrName: ObjectType<any>|string): RepositoryAggregator {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.hasTarget(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        const repositoryAggregator = this.repositoryAggregators.find(repositoryAggregate => repositoryAggregate.metadata === metadata);
        if (!repositoryAggregator)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return repositoryAggregator;
    }

    /**
     * Builds all registered metadatas.
     */
    protected buildMetadatas() {

        this.entitySubscribers.length = 0;
        this.entityListeners.length = 0;
        this.repositoryAggregators.length = 0;
        this.entityMetadatas.length = 0;

        const namingStrategy = this.createNamingStrategy();
        const lazyRelationsWrapper = this.createLazyRelationsWrapper();

        // take imported event subscribers
        if (this.subscriberClasses && this.subscriberClasses.length) {
            getMetadataArgsStorage()
                .entitySubscribers
                .filterByTargets(this.subscriberClasses)
                .map(metadata => getFromContainer(metadata.target))
                .forEach(subscriber => this.entitySubscribers.push(subscriber));
        }

        // take imported entity listeners
        if (this.entityClasses && this.entityClasses.length) {
            getMetadataArgsStorage()
                .entityListeners
                .filterByTargets(this.entityClasses)
                .forEach(metadata => this.entityListeners.push(new EntityListenerMetadata(metadata)));
        }
        
        // build entity metadatas from metadata args storage (collected from decorators)
        if (this.entityClasses && this.entityClasses.length) {
            getFromContainer(EntityMetadataBuilder)
                .buildFromMetadataArgsStorage(this.driver, lazyRelationsWrapper, namingStrategy, this.entityClasses)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.repositoryAggregators.push(new RepositoryAggregator(this, metadata));
                });
        }

        // build entity metadatas from given entity schemas
        if (this.entitySchemas && this.entitySchemas.length) {
            getFromContainer(EntityMetadataBuilder)
                .buildFromSchemas(this.driver, lazyRelationsWrapper, namingStrategy, this.entitySchemas)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.repositoryAggregators.push(new RepositoryAggregator(this, metadata));
                });
        }
    }

    /**
     * Creates a naming strategy to be used for this connection.
     */
    protected createNamingStrategy(): NamingStrategyInterface {
        
        // if naming strategies are not loaded, or used naming strategy is not set then use default naming strategy
        if (!this.namingStrategyClasses || !this.namingStrategyClasses.length || !this.usedNamingStrategy)
            return getFromContainer(DefaultNamingStrategy);
            
        // try to find used naming strategy in the list of loaded naming strategies
        const namingMetadata = getMetadataArgsStorage()
            .namingStrategies
            .filterByTargets(this.namingStrategyClasses)
            .find(strategy => {
                if (typeof this.usedNamingStrategy === "string") {
                    return strategy.name === this.usedNamingStrategy;
                } else {
                    return strategy.target === this.usedNamingStrategy;
                }
            });
        
        // throw an error if not found
        if (!namingMetadata)
            throw new NamingStrategyNotFoundError(this.usedNamingStrategy, this.name);

        // initialize a naming strategy instance
        return getFromContainer<NamingStrategyInterface>(namingMetadata.target);
    }

    /**
     * Creates a new default entity manager without single connection setup.
     */
    protected createEntityManager() {
        return new EntityManager(this, false);
    }

    /**
     * Creates a new default reactive entity manager without single connection setup.
     */
    protected createReactiveEntityManager() {
        return new ReactiveEntityManager(this, false);
    }

    /**
     * Creates a new entity broadcaster using in this connection.
     */
    protected createBroadcaster() {
        // todo: better to pass connection?
        return new Broadcaster(this.entityMetadatas, this.entitySubscribers, this.entityListeners);
    }

    /**
     * Creates a schema builder used to build a database schema for the entities of the current connection.
     */
    protected createSchemaBuilder() {
        return new SchemaBuilder(this.driver, this.logger, this.entityMetadatas, this.createNamingStrategy());
    }

    /**
     * Creates a lazy relations wrapper.
     */
    protected createLazyRelationsWrapper() {
        // todo: send connection instead?
        return new LazyRelationsWrapper(this.driver, this.entityMetadatas, this.broadcaster);
    }

}