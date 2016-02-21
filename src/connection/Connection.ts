import {Driver} from "../driver/Driver";
import {ConnectionOptions} from "./ConnectionOptions";
import {Repository} from "../repository/Repository";
import {OrmSubscriber} from "../subscriber/OrmSubscriber";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {BroadcasterNotFoundError} from "./error/BroadcasterNotFoundError";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";
import {SchemaCreator} from "../schema-creator/SchemaCreator";

/**
 * A single connection instance to the database. Each connection has its own repositories, subscribers and metadatas.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private _name: string;
    private _driver: Driver;
    private _metadatas: EntityMetadata[] = [];
    private _subscribers: OrmSubscriber<any>[] = [];
    private _broadcasters: OrmBroadcaster<any>[] = [];
    private _repositories: Repository<any>[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, driver: Driver) {
        this._name = name;
        this._driver = driver;
    }

    // -------------------------------------------------------------------------
    // Getter / Setter Methods
    // -------------------------------------------------------------------------

    /**
     * The name of the connection.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Database driver used by this connection.
     */
    get driver(): Driver {
        return this._driver;
    }

    /**
     * All subscribers that are registered for this connection.
     */
    get subscribers(): OrmSubscriber<any>[] {
        return this._subscribers;
    }

    /**
     * All broadcasters that are registered for this connection.
     */
    get broadcasters(): OrmBroadcaster<any>[] {
        return this._broadcasters;
    }

    /**
     * All metadatas that are registered for this connection.
     */
    get metadatas(): EntityMetadata[] {
        return this._metadatas;
    }

    /**
     * All repositories that are registered for this connection.
     */
    get repositories(): Repository<any>[] {
        return this._repositories;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(options: ConnectionOptions): Promise<void> {
        const schemaCreator = new SchemaCreator(this);
        return this._driver.connect(options)
            .then(() => {
                if (options.autoSchemaCreate === true)
                    return schemaCreator.create();
            });
    }

    /**
     * Closes this connection.
     */
    close(): Promise<void> {
        return this._driver.disconnect();
    }

    /**
     * Adds a new entity metadatas.
     */
    addMetadatas(metadatas: EntityMetadata[]) {
        this._metadatas     = this._metadatas.concat(metadatas);
        this._broadcasters  = this._broadcasters.concat(metadatas.map(metadata => this.createBroadcasterForMetadata(metadata)));
        this._repositories  = this._repositories.concat(metadatas.map(metadata => this.createRepositoryForMetadata(metadata)));
    }

    /**
     * Adds subscribers to this connection.
     */
    addSubscribers(subscribers: OrmSubscriber<any>[]) {
        this._subscribers = this._subscribers.concat(subscribers);
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: Function): Repository<Entity> {
        const metadata = this.getMetadata(entityClass);
        const repository = this.repositories.find(repository => repository.metadata === metadata);
        if (!repository)
            throw new RepositoryNotFoundError(entityClass);

        return repository;
    }

    /**
     * Gets the metadata for the given entity class.
     */
    getMetadata(entityClass: Function): EntityMetadata {
        const metadata = this.metadatas.find(metadata => metadata.target === entityClass);
        // todo:
        // if (!metadata)
        //    throw new MetadataNotFoundError(entityClass);

        return metadata;
    }

    /**
     * Gets the broadcaster for the given entity class.
     */
    getBroadcaster<Entity>(entityClass: Function): OrmBroadcaster<Entity> {
        let metadata = this.broadcasters.find(broadcaster => broadcaster.entityClass === entityClass);
        if (!metadata)
            throw new BroadcasterNotFoundError(entityClass);

        return metadata;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createBroadcasterForMetadata(metadata: EntityMetadata): OrmBroadcaster<any> {
        return new OrmBroadcaster<any>(this.subscribers, metadata.target);
    }

    private createRepositoryForMetadata(metadata: EntityMetadata): Repository<any> {
        return new Repository<any>(this, metadata, this.getBroadcaster(metadata.target));
    }

}