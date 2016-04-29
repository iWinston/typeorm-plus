import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";
import {Repository} from "../repository/Repository";
import {EventSubscriberInterface} from "../subscriber/EventSubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaCreator} from "../schema-creator/SchemaCreator";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {EntityManager} from "../repository/EntityManager";
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

/**
 * Temporary type to store and link both repository and its metadata.
 */
type RepositoryAndMetadata = { repository: Repository<any>, metadata: EntityMetadata };

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
        
        this.entityClasses.push(...entities);
        return this;
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importSubscribers(subscriberClasses: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("event subscribers", this.name);
        
        this.subscriberClasses.push(...subscriberClasses);
        return this;
    }

    /**
     * Imports entities for the current connection.
     */
    importNamingStrategies(strategies: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("naming strategies", this.name);
        
        this.namingStrategyClasses.push(...strategies);
        return this;
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): Repository<Entity> {
        if (!this.isConnected)
            throw new NoConnectionForRepositoryError(this.name);

        const metadata = this.entityMetadatas.findByTarget(entityClass);
        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(this.name, entityClass);

        return repoMeta.repository;
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
        this.namingStrategyMetadatas.push(...metadatas);

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

        this.entityMetadatas.push(...entityMetadatas);
        this.entityListeners.push(...entityListenerMetadatas);
        this.repositoryAndMetadatas.push(...entityMetadatas.map(metadata => this.createRepoMeta(metadata)));
    }

    /**
     * Gets the naming strategy to be used for this connection.
     */
    private createNamingStrategy() {
        if (!this.options.namingStrategy)
            return new DefaultNamingStrategy();

        const namingMetadata = this.namingStrategyMetadatas.find(strategy => strategy.name === this.options.namingStrategy);
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
        return {
            metadata: metadata,
            repository: new Repository<any>(this, this.entityMetadatas, metadata)
        };
    }

}