import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";
import {Repository} from "../repository/Repository";
import {EventSubscriberInterface} from "../subscriber/EventSubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaCreator} from "../schema-creator/SchemaCreator";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {EntityManager} from "../entity-manager/EntityManager";
import {importClassesFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {defaultMetadataStorage, getContainer} from "../typeorm";
import {EntityMetadataBuilder} from "../metadata-storage/EntityMetadataBuilder";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {EntityMetadataCollection} from "../metadata/collection/EntityMetadataCollection";
import {NamingStrategyMetadata} from "../metadata/NamingStrategyMetadata";
import {NoConnectionForRepositoryError} from "./error/NoConnectionForRepositoryError";
import {CannotImportAlreadyConnectedError} from "./error/CannotImportAlreadyConnectedError";
import {CannotCloseNotConnectedError} from "./error/CannotCloseNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "./error/CannotConnectAlreadyConnectedError";
import {ReactiveRepository} from "../repository/ReactiveRepository";
import {ReactiveEntityManager} from "../entity-manager/ReactiveEntityManager";
import {TreeRepository} from "../repository/TreeRepository";
import {ReactiveTreeRepository} from "../repository/ReactiveTreeRepository";

/**
 * Temporary type to store and link both repository and its metadata.
 */
type RepositoryAndMetadata = { metadata: EntityMetadata, repository: Repository<any>, reactiveRepository: ReactiveRepository<any> };

/**
 * A single connection instance to the database. Each connection has its own repositories, subscribers and metadatas.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private repositoryAndMetadatas: RepositoryAndMetadata[] = [];

    // -------------------------------------------------------------------------
    // Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Gets EntityManager of this connection.
     */
    readonly entityManager: EntityManager;

    /**
     * Gets ReactiveEntityManager of this connection.
     */
    readonly reactiveEntityManager: ReactiveEntityManager;

    /**
     * The name of the connection.
     */
    readonly name: string;

    /**
     * Database driver used by this connection.
     */
    readonly driver: Driver;

    /**
     * All entity listener metadatas that are registered for this connection.
     */
    readonly entityListeners: EntityListenerMetadata[] = [];

    /**
     * All subscribers that are registered for this connection.
     */
    readonly eventSubscribers: EventSubscriberInterface<any>[] = [];

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    private readonly options: ConnectionOptions;

    /**
     * All entity metadatas that are registered for this connection.
     */
    private readonly entityMetadatas = new EntityMetadataCollection();

    /**
     * All naming strategy metadatas that are registered for this connection.
     */
    private readonly namingStrategyMetadatas: NamingStrategyMetadata[] = [];

    /**
     * Registered entity classes to be used for this connection.
     */
    private readonly entityClasses: Function[] = [];

    /**
     * Registered subscriber classes to be used for this connection.
     */
    private readonly subscriberClasses: Function[] = [];

    /**
     * Registered naming strategy classes to be used for this connection.
     */
    private readonly namingStrategyClasses: Function[] = [];

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
        this.entityManager = new EntityManager(this);
        this.reactiveEntityManager = new ReactiveEntityManager(this);
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

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);
        
        return this.driver.connect().then(() => {
            
            // first build all metadata
            this.buildMetadatas();
            
            // second build schema
            if (this.options.autoSchemaCreate === true)
                return this.syncSchema();

            return Promise.resolve();

        }).then(() => {
            this._isConnected = true;
            return this;
        });
    }

    /**
     * Closes this connection.
     */
    close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotCloseNotConnectedError(this.name);
        
        return this.driver.disconnect();
    }

    /**
     * Creates database schema for all entities registered in this connection.
     */
    syncSchema() {
        const schemaBuilder = this.driver.createSchemaBuilder();
        const schemaCreator = new SchemaCreator(schemaBuilder, this.entityMetadatas);
        return schemaCreator.create();
    }

    /**
     * Imports entities from the given paths (directories) for the current connection. 
     */
    importEntitiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports subscribers from the given paths (directories) for the current connection.
     */
    importSubscribersFromDirectories(paths: string[]): this {
        this.importSubscribers(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports naming strategies from the given paths (directories) for the current connection.
     */
    importNamingStrategiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }
    
    /**
     * Imports entities for the current connection.
     */
    importEntities(entities: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entities", this.name);

        entities.forEach(cls => this.entityClasses.push(cls));
        return this;
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importSubscribers(subscriberClasses: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("event subscribers", this.name);

        subscriberClasses.forEach(cls => this.subscriberClasses.push(cls));
        return this;
    }

    /**
     * Imports entities for the current connection.
     */
    importNamingStrategies(strategies: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("naming strategies", this.name);
        
        strategies.forEach(cls => this.namingStrategyClasses.push(cls));
        return this;
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): Repository<Entity>;
    // getRepository<Entity>(entityClass: Function): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityClass: string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): Repository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        let metadata: EntityMetadata;
        if (typeof entityClassOrName === "string") {
            metadata = this.entityMetadatas.findByName(entityClassOrName);
        } else {
            metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        }
        
        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return repoMeta.repository;
    }

    /**
     * Gets repository for the given entity class.
     */
    getTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): TreeRepository<Entity>;
    // getTreeRepository<Entity>(entityClass: Function): TreeRepository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getTreeRepository<Entity>(entityClass: string): TreeRepository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getTreeRepository<Entity>(entityClassOrName: ConstructorFunction<Entity>|Function|string): TreeRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        let metadata: EntityMetadata;
        if (typeof entityClassOrName === "string") {
            metadata = this.entityMetadatas.findByName(entityClassOrName);
        } else {
            metadata = this.entityMetadatas.findByTarget(entityClassOrName);
        }

        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);
        if (!repoMeta.metadata.table.isClosure)
            throw new Error(`Cannot get a tree repository. ${repoMeta.metadata.name} is not a tree table. Try to use @ClosureTable decorator instead of @Table.`);

        return <TreeRepository<Entity>> repoMeta.repository;
    }

    /**
     * Gets reactive repository for the given entity class.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        const metadata = this.entityMetadatas.findByTarget(entityClass);
        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(this.name, entityClass);

        return repoMeta.reactiveRepository;
    }

    /**
     * Gets reactive tree repository for the given entity class.
     */
    getReactiveTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveTreeRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        const metadata = this.entityMetadatas.findByTarget(entityClass);
        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(this.name, entityClass);
        if (!repoMeta.metadata.table.isClosure)
            throw new Error(`Cannot get a tree repository. ${repoMeta.metadata.name} is not a tree table. Try to use @ClosureTable decorator instead of @Table.`);

        return <ReactiveTreeRepository<Entity>> repoMeta.reactiveRepository;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Builds all registered metadatas.
     */
    private buildMetadatas() {
        
        // first register naming strategies
        const metadatas = defaultMetadataStorage().namingStrategyMetadatas.filterByClasses(this.namingStrategyClasses);
        metadatas.forEach(cls => this.namingStrategyMetadatas.push(cls));

        // second register subscriber metadatas
        const subscribers = defaultMetadataStorage()
            .eventSubscriberMetadatas
            .filterByClasses(this.subscriberClasses)
            .map(metadata => this.createContainerInstance(metadata.target));
        this.eventSubscribers.push(...subscribers);

        // third register entity and entity listener metadatas
        const entityMetadataBuilder = new EntityMetadataBuilder(this.createNamingStrategy());
        const entityMetadatas = entityMetadataBuilder.build(this.entityClasses);
        const entityListenerMetadatas = defaultMetadataStorage().entityListenerMetadatas.filterByClasses(this.entityClasses);

        entityMetadatas.forEach(cls => this.entityMetadatas.push(cls));
        entityListenerMetadatas.forEach(cls => this.entityListeners.push(cls));
        entityMetadatas.map(metadata => this.createRepoMeta(metadata)).forEach(cls => this.repositoryAndMetadatas.push(cls));
    }

    /**
     * Gets the naming strategy to be used for this connection.
     */
    private createNamingStrategy() {
        if (!this.options.namingStrategy)
            return new DefaultNamingStrategy();

        const namingMetadata = this.namingStrategyMetadatas.find(strategy => strategy.name === this.options.namingStrategy);
        if (!namingMetadata)
            throw new Error(`Naming strategy called "${this.options.namingStrategy}" was not found.`);
        
        return this.createContainerInstance(namingMetadata.target);
    }

    /**
     * Creates a new instance of the given constructor. If service container is registered in the ORM, then it will
     * be used, otherwise new instance of naming strategy will be created.
     */
    private createContainerInstance(constructor: Function) {
        return getContainer() ? getContainer().get(constructor) : new (<any> constructor)();
    }

    /**
     * Creates a temporary object RepositoryAndMetadata to store relation between repository and metadata.
     */
    private createRepoMeta(metadata: EntityMetadata): RepositoryAndMetadata {
        if (metadata.table.isClosure) {
            const repository = new TreeRepository<any>(this, this.entityMetadatas, metadata);
            return {
                metadata: metadata,
                repository: repository,
                reactiveRepository: new ReactiveTreeRepository(repository)
            };
        } else {
            const repository = new Repository<any>(this, this.entityMetadatas, metadata);
            return {
                metadata: metadata,
                repository: repository,
                reactiveRepository: new ReactiveRepository(repository)
            };
        }
    }

}