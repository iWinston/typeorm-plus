import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ConstructorFunction} from "../common/ConstructorFunction";
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
import {ReactiveTreeRepository} from "../repository/ReactiveTreeRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {NamingStrategyNotFoundError} from "./error/NamingStrategyNotFoundError";
import {EntityManagerFactory} from "../entity-manager/EntityManagerFactory";
import {RepositoryFactory} from "../repository/RepositoryFactory";
import {SchemaCreatorFactory} from "../schema-creator/SchemaCreatorFactory";
import {ReactiveRepositoryNotFoundError} from "./error/ReactiveRepositoryNotFoundError";
import {RepositoryNotTreeError} from "./error/RepositoryNotTreeError";
import {EntitySchema} from "../metadata/entity-schema/EntitySchema";
import {CannotSyncNotConnectedError} from "./error/CannotSyncNotConnectedError";
import {CannotUseNamingStrategyNotConnectedError} from "./error/CannotUseNamingStrategyNotConnectedError";
import {Broadcaster} from "../subscriber/Broadcaster";
import {BroadcasterFactory} from "../subscriber/BroadcasterFactory";
import {CannotGetEntityManagerNotConnectedError} from "./error/CannotGetEntityManagerNotConnectedError";
import {LazyRelationsWrapper} from "../repository/LazyRelationsWrapper";

/**
 * A single connection instance to the database. 
 * Each connection has its own entity manager, repositories, subscribers and metadatas.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * The name of the connection.
     */
    public readonly name: string;

    /**
     * Database driver used by this connection.
     */
    public readonly driver: Driver;

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
     * Used to initialize lazy relations.
     */
    private readonly lazyRelationsWrapper: LazyRelationsWrapper;

    /**
     * All entity listener metadatas that are registered for this connection.
     */
    private readonly entityListeners: EntityListenerMetadata[] = [];

    /**
     * All subscribers that are registered for this connection.
     */
    private readonly entitySubscribers: EntitySubscriberInterface<any>[] = [];

    /**
     * Used to broadcast connection events.
     */
    private readonly broadcaster: Broadcaster;

    /**
     * Connection options.
     */
    private readonly options: ConnectionOptions;

    /**
     * All entity metadatas that are registered for this connection.
     */
    private readonly entityMetadatas = new EntityMetadataCollection();

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
     * All connection's repositories.
     */
    private readonly repositories: Repository<any>[] = [];

    /**
     * All connection's reactive repositories.
     */
    private readonly reactiveRepositories: ReactiveRepository<any>[] = [];

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

    constructor(name: string, driver: Driver, options: ConnectionOptions) {
        this.name = name;
        this.driver = driver;
        this.driver.connectionOptions = options;
        this.options = options;
        this._entityManager = getFromContainer(EntityManagerFactory).createEntityManager(this);
        this._reactiveEntityManager = getFromContainer(EntityManagerFactory).createReactiveEntityManager(this);
        this.broadcaster = getFromContainer(BroadcasterFactory).createBroadcaster(this.entityMetadatas, this.entitySubscribers, this.entityListeners);
        this.lazyRelationsWrapper = new LazyRelationsWrapper(this.driver, this.entityMetadatas, this.broadcaster);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Returns true if connection to the database already established for this connection.
     */
    get isConnected() {
        return this._isConnected;
    }

    /**
     * Entity manager allows to work with any entity of your connection.
     */
    get entityManager() {
        if (!this.isConnected)
            throw new CannotGetEntityManagerNotConnectedError(this.name);
        
        return this._entityManager;
    }

    /**
     * Entity manager allows to work with any entity of your connection.
     * This version of entity manager is reactive - works with Observables instead of promises.
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

        // second build schema
        if (this.options.autoSchemaCreate === true)
            await this.syncSchema();
        
        return this;
    }

    /**
     * Closes this connection.
     */
    async close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotCloseNotConnectedError(this.name);

        await this.driver.disconnect();
        this._isConnected = false;
    }

    /**
     * Creates database schema for all entities registered in this connection.
     */
    async syncSchema(dropBeforeSync: boolean = false): Promise<void> {
        if (!this.isConnected)
            throw new CannotSyncNotConnectedError(this.name);
        
        if (dropBeforeSync)
            await this.driver.clearDatabase();

        const schemaBuilder = this.driver.createSchemaBuilder();
        const schemaCreatorFactory = getFromContainer(SchemaCreatorFactory);
        const schemaCreator = schemaCreatorFactory.create(schemaBuilder, this.entityMetadatas);
        return schemaCreator.create();
    }

    /**
     * Imports entities from the given paths (directories) for the current connection.
     */
    async importEntitiesFromDirectories(paths: string[]): Promise<this> {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entity schemas from the given paths (directories) for the current connection.
     */
    async importEntitySchemaFromDirectories(paths: string[]): Promise<this> {
        this.importEntitySchemas(importJsonsFromDirectories(paths));
        return this;
    }

    /**
     * Imports subscribers from the given paths (directories) for the current connection.
     */
    async importSubscribersFromDirectories(paths: string[]): Promise<this> {
        this.importSubscribers(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports naming strategies from the given paths (directories) for the current connection.
     */
    async importNamingStrategiesFromDirectories(paths: string[]): Promise<this> {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entities for the current connection.
     */
    async importEntities(entities: Function[]): Promise<this> {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entities", this.name);

        entities.forEach(cls => this.entityClasses.push(cls));
        return this;
    }

    /**
     * Imports schemas for the current connection.
     */
    async importEntitySchemas(schemas: EntitySchema[]): Promise<this> {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("schemas", this.name);

        schemas.forEach(schema => this.entitySchemas.push(schema));
        return this;
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    async importSubscribers(subscriberClasses: Function[]): Promise<this> {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entity subscribers", this.name);

        subscriberClasses.forEach(cls => this.subscriberClasses.push(cls));
        return this;
    }

    /**
     * Imports entities for the current connection.
     */
    async importNamingStrategies(strategies: Function[]): Promise<this> {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("naming strategies", this.name);

        strategies.forEach(cls => this.namingStrategyClasses.push(cls));
        return this;
    }

    /**
     * Sets given naming strategy to be used. Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(name: string): this;

    /**
     * Sets given naming strategy to be used. Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(strategy: Function): this;

    /**
     * Sets given naming strategy to be used. Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(strategyClassOrName: string|Function): this {
        if (this.isConnected)
            throw new CannotUseNamingStrategyNotConnectedError(this.name);

        this.usedNamingStrategy = strategyClassOrName;
        return this;
    }

    /**
     * Gets the entity metadata of the given entity target.
     */
    getMetadata(entity: Function) {
        return this.entityMetadatas.findByTarget(entity);
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityClass: string): Repository<Entity>;
    
    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): Repository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.hasTarget(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        const repository = this.repositories.find(repository => Repository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return repository;
    }

    /**
     * Gets tree repository for the given entity class.
     */
    getTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity name.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity name.
     */
    getTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): Repository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     */
    getTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): TreeRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.hasTarget(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        const repository = this.repositories.find(repository => Repository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        if (!metadata.table.isClosure)
            throw new RepositoryNotTreeError(entityClassOrName);

        return <TreeRepository<Entity>> repository;
    }

    /**
     * Gets reactive repository for the given entity class.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity name.
     */
    getReactiveRepository<Entity>(entityName: string): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity name.
     */
    getReactiveRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): ReactiveRepository<Entity>;

    /**
     * Gets reactive repository for the given entity class.
     */
    getReactiveRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): ReactiveRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.hasTarget(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        const repository = this.reactiveRepositories.find(repository => ReactiveRepository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new ReactiveRepositoryNotFoundError(this.name, entityClassOrName);

        return repository;
    }

    /**
     * Gets reactive tree repository for the given entity class.
     */
    getReactiveTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveTreeRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity name.
     */
    getReactiveTreeRepository<Entity>(entityName: string): ReactiveTreeRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity name.
     */
    getReactiveTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): ReactiveTreeRepository<Entity>;

    /**
     * Gets reactive tree repository for the given entity class.
     */
    getReactiveTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): ReactiveTreeRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.hasTarget(entityClassOrName))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        const repository = this.reactiveRepositories.find(repository => ReactiveRepository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        if (!metadata.table.isClosure)
            throw new RepositoryNotTreeError(entityClassOrName);

        return <ReactiveTreeRepository<Entity>> repository;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Builds all registered metadatas.
     */
    private buildMetadatas() {
        
        const namingStrategy = this.createNamingStrategy();

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
                .buildFromMetadataArgsStorage(this.lazyRelationsWrapper, namingStrategy, this.entityClasses)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.createRepository(metadata);
                });
        }

        // build entity metadatas from given entity schemas
        if (this.entitySchemas && this.entitySchemas.length) {
            getFromContainer(EntityMetadataBuilder)
                .buildFromSchemas(this.lazyRelationsWrapper, namingStrategy, this.entitySchemas)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.createRepository(metadata);
                });
        }
    }

    /**
     * Creates a naming strategy to be used for this connection.
     */
    private createNamingStrategy(): NamingStrategyInterface {
        
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
     * Creates repository and reactive repository for the given entity metadata.
     */
    private createRepository(metadata: EntityMetadata): void {
        const repositoryFactory = getFromContainer(RepositoryFactory);
        if (metadata.table.isClosure) {
            const repository = repositoryFactory.createTreeRepository(this, this.broadcaster, this.entityMetadatas, metadata);
            const reactiveRepository = repositoryFactory.createReactiveTreeRepository(repository);
            this.repositories.push(repository);
            this.reactiveRepositories.push(reactiveRepository);

        } else {
            const repository = repositoryFactory.createRepository(this, this.broadcaster, this.entityMetadatas, metadata);
            const reactiveRepository = repositoryFactory.createReactiveRepository(repository);
            this.repositories.push(repository);
            this.reactiveRepositories.push(reactiveRepository);
        }
    }
    
}