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
import {defaultMetadataStorage, getFromContainer} from "../index";
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
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {RepositoryBuilder} from "../repository/RepositoryBuilder";

/**
 * A single connection instance to the database. Each connection has its own repositories, subscribers and metadatas.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private repositories: Repository<any>[] = [];
    private reactiveRepositories: ReactiveRepository<any>[] = [];

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
    async connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);

        // connect to the database via its driver
        await this.driver.connect();

        // build all metadatas registered in the current connection
        this.buildMetadatas();

        // second build schema
        if (this.options.autoSchemaCreate === true)
            await this.syncSchema();

        // set connected status for the current connection
        this._isConnected = true;
        return this;
    }

    /**
     * Closes this connection.
     */
    async close(): Promise<void> {
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

        const repository = this.repositories.find(repository => Repository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return repository;
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

        const repository = this.repositories.find(repository => Repository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);
        if (!metadata.table.isClosure)
            throw new Error(`Cannot get a tree repository. ${metadata.name} is not a tree table. Try to use @ClosureTable decorator instead of @Table.`);

        return <TreeRepository<Entity>> repository;
    }

    /**
     * Gets reactive repository for the given entity class.
     */
    getReactiveRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        const metadata = this.entityMetadatas.findByTarget(entityClass);
        const repository = this.reactiveRepositories.find(repository => ReactiveRepository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClass); // todo throw ReactiveRepositoryNotFoundError

        return repository;
    }

    /**
     * Gets reactive tree repository for the given entity class.
     */
    getReactiveTreeRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): ReactiveTreeRepository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        const metadata = this.entityMetadatas.findByTarget(entityClass);
        const repository = this.reactiveRepositories.find(repository => ReactiveRepository.ownsMetadata(repository, metadata));
        if (!repository)
            throw new RepositoryNotFoundError(this.name, entityClass);
        if (!metadata.table.isClosure)
            throw new Error(`Cannot get a tree repository. ${metadata.name} is not a tree table. Try to use @ClosureTable decorator instead of @Table.`);

        return <ReactiveTreeRepository<Entity>> repository;
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
            .map(metadata => getFromContainer(metadata.target));
        this.eventSubscribers.push(...subscribers);

        // third register entity and entity listener metadatas
        const entityMetadataBuilder = new EntityMetadataBuilder(this.createNamingStrategy());
        const entityMetadatas = entityMetadataBuilder.build(this.entityClasses);
        const entityListenerMetadatas = defaultMetadataStorage().entityListenerMetadatas.filterByClasses(this.entityClasses);

        entityMetadatas.forEach(cls => this.entityMetadatas.push(cls));
        entityListenerMetadatas.forEach(cls => this.entityListeners.push(cls));
        entityMetadatas.forEach(metadata => this.createRepository(metadata));
    }

    /**
     * Gets the naming strategy to be used for this connection.
     */
    private createNamingStrategy(): NamingStrategyInterface {
        if (!this.options.namingStrategy)
            return new DefaultNamingStrategy();

        const namingMetadata = this.namingStrategyMetadatas.find(strategy => strategy.name === this.options.namingStrategy);
        if (!namingMetadata)
            throw new Error(`Naming strategy called "${this.options.namingStrategy}" was not found.`);

        return getFromContainer<NamingStrategyInterface>(namingMetadata.target);
    }

    /**
     * Creates repository and reactive repository for the given entity metadata.
     */
    private createRepository(metadata: EntityMetadata) {
        if (metadata.table.isClosure) {
            const repository = new TreeRepository<any>(this, this.entityMetadatas, metadata);
            this.repositories.push(repository);
            this.reactiveRepositories.push(new ReactiveTreeRepository(repository));
        } else {
            const repository = new Repository<any>(this, this.entityMetadatas, metadata);
            this.repositories.push(repository);
            this.reactiveRepositories.push(new ReactiveRepository(repository));
        }
    }

}