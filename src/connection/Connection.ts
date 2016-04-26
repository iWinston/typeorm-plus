import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";
import {Repository} from "../repository/Repository";
import {EventSubscriberInterface} from "../subscriber/EventSubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {SchemaCreator} from "../schema-creator/SchemaCreator";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {EntityListenerMetadata} from "../metadata-builder/metadata/EntityListenerMetadata";
import {EntityManager} from "../repository/EntityManager";
import {importClassesFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {defaultMetadataStorage, getContainer} from "../typeorm";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {EntityMetadataArray} from "../metadata-builder/metadata/EntityMetadataArray";
import {NamingStrategyMetadata} from "../metadata-builder/metadata/NamingStrategyMetadata";

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
    readonly subscriberMetadatas: EventSubscriberInterface<any>[] = [];

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
    private readonly entityMetadatas = new EntityMetadataArray();

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
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(): Promise<void> {
        return this.driver.connect().then(() => {
            
            // build all metadata
            this.registerMetadatas();
            
            // second build schema
            if (this.options.autoSchemaCreate === true)
                return this.createSchema();

            return undefined;
        });
    }

    /**
     * Closes this connection.
     */
    close(): Promise<void> {
        return this.driver.disconnect();
    }

    /**
     * Creates database schema for all entities registered in this connection.
     */
    createSchema() {
        const schemaBuilder = this.driver.createSchemaBuilder();
        const schemaCreator = new SchemaCreator(schemaBuilder, this.entityMetadatas);
        return schemaCreator.create();
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): Repository<Entity> {
        const metadata = this.entityMetadatas.findByTarget(entityClass);
        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(entityClass);

        return repoMeta.repository;
    }

    /**
     * Imports entities from the given paths (directories) for the current connection. 
     */
    importEntitiesFromDirectories(paths: string[]): void {
        this.importEntities(importClassesFromDirectories(paths));
    }

    /**
     * Imports subscribers from the given paths (directories) for the current connection.
     */
    importSubscribersFromDirectories(paths: string[]): void {
        this.importSubscribers(importClassesFromDirectories(paths));
    }

    /**
     * Imports naming strategies from the given paths (directories) for the current connection.
     */
    importNamingStrategiesFromDirectories(paths: string[]): void {
        this.importEntities(importClassesFromDirectories(paths));
    }
    
    /**
     * Imports entities for the current connection.
     */
    importEntities(entities: Function[]): this {
        this.entityClasses.push(...entities);
        return this;
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importSubscribers(subscriberClasses: Function[]): this {
        this.subscriberClasses.push(...subscriberClasses);
        return this;
    }

    /**
     * Imports entities for the current connection.
     */
    importNamingStrategies(strategies: Function[]): this {
        this.namingStrategyClasses.push(...strategies);
        return this;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    
    private registerMetadatas() {
        
        // first register naming strategies
        const metadatas = defaultMetadataStorage().findNamingStrategiesForClasses(this.namingStrategyClasses);
        this.namingStrategyMetadatas.push(...metadatas);

        // second register subscriber metadatas
        const subscribers = defaultMetadataStorage()
            .findEventSubscribersForClasses(this.subscriberClasses)
            .map(metadata => this.createContainerInstance(metadata.target));
        this.subscriberMetadatas.push(...subscribers);

        // third register entity and entity listener metadatas
        const entityMetadataBuilder = new EntityMetadataBuilder(this.createNamingStrategy());
        const entityMetadatas = entityMetadataBuilder.build(this.entityClasses);
        const entityListenerMetadatas = defaultMetadataStorage().findEntityListenersForClasses(this.entityClasses);

        this.entityMetadatas.push(...entityMetadatas);
        this.entityListeners.push(...entityListenerMetadatas);
        this.repositoryAndMetadatas.push(...entityMetadatas.map(metadata => this.createRepoMeta(metadata)));
    }

    /**
     * Gets the naming strategy
     */
    private createNamingStrategy() {
        if (!this.options.namingStrategy)
            return new DefaultNamingStrategy();

        const namingMetadata = this.namingStrategyMetadatas.find(strategy => strategy.name === this.options.namingStrategy);
        return this.createContainerInstance(namingMetadata.target);
    }

    /**
     * Creates a new instance of the given constructor. If IOC Container is registered in the ORM
     */
    private createContainerInstance(constructor: Function) {
        return getContainer() ? getContainer().get(constructor) : new (<any> constructor)();
    }

    /**
     * Creates a temporary object RepositoryAndMetadata to store mapping between repository and metadata.
     */
    private createRepoMeta(metadata: EntityMetadata): RepositoryAndMetadata {
        return {
            metadata: metadata,
            repository: new Repository<any>(this, this.entityMetadatas, metadata)
        };
    }

}