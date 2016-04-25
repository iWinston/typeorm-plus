import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";
import {Repository} from "../repository/Repository";
import {EventSubscriberInterface} from "../subscriber/EventSubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {SchemaCreator} from "../schema-creator/SchemaCreator";
import {MetadataNotFoundError} from "./error/MetadataNotFoundError";
import {ConstructorFunction} from "../common/ConstructorFunction";
import {EntityListenerMetadata} from "../metadata-builder/metadata/EntityListenerMetadata";
import {EntityManager} from "../repository/EntityManager";

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
     * Database connection options.
     */
    readonly options: ConnectionOptions;

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
     * All entity metadatas that are registered for this connection.
     */
    readonly entityMetadatas: EntityMetadata[] = [];

    /**
     * All entity listener metadatas that are registered for this connection.
     */
    readonly entityListeners: EntityListenerMetadata[] = [];

    /**
     * All subscribers that are registered for this connection.
     */
    readonly subscribers: EventSubscriberInterface<any>[] = [];

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
     * All repositories that are registered for this connection.
     */
    get repositories(): Repository<any>[] {
        return this.repositoryAndMetadatas.map(repoAndMeta => repoAndMeta.repository);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(): Promise<void> {
        const schemaCreator = new SchemaCreator(this);
        return this.driver.connect().then(() => {
            if (this.options.autoSchemaCreate === true)
                return schemaCreator.create();

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
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ConstructorFunction<Entity>|Function): Repository<Entity> {
        // const metadata = this.getEntityMetadata(entityClass);
        const metadata = this.entityMetadatas.find(metadata => metadata.target === entityClass);
        const repoMeta = this.repositoryAndMetadatas.find(repoMeta => repoMeta.metadata === metadata);
        if (!repoMeta)
            throw new RepositoryNotFoundError(entityClass);

        return repoMeta.repository;
    }

    /**
     * Gets the entity metadata for the given entity class.
     */
    getEntityMetadata(entityClass: Function): EntityMetadata {
        const metadata = this.entityMetadatas.find(metadata => metadata.target === entityClass);
        if (!metadata)
            throw new MetadataNotFoundError(entityClass);

        return metadata;
    }

    /**
     * Registers entity metadatas for the current connection.
     */
    addEntityMetadatas(metadatas: EntityMetadata[]): Connection {
        this.entityMetadatas.push(...metadatas);
        this.repositoryAndMetadatas = this.repositoryAndMetadatas.concat(metadatas.map(metadata => this.createRepoMeta(metadata)));
        return this;
    }

    /**
     * Registers entity listener metadatas for the current connection.
     */
    addEntityListenerMetadatas(metadatas: EntityListenerMetadata[]): Connection {
        this.entityListeners.push(...metadatas);
        return this;
    }

    /**
     * Registers subscribers for the current connection.
     */
    addSubscribers(subscribers: EventSubscriberInterface<any>[]): Connection {
        this.subscribers.push(...subscribers);
        return this;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createRepoMeta(metadata: EntityMetadata): RepositoryAndMetadata {
        return {
            metadata: metadata,
            repository: new Repository<any>(this, this.entityMetadatas, metadata)
        };
    }

}