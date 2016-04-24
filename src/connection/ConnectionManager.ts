import {Connection} from "./Connection";
import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {Driver} from "../driver/Driver";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {importClassesFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {ConnectionOptions} from "tls";
import {NamingStrategy} from "../naming-strategy/NamingStrategy";
import {CannotSetNamingStrategyError} from "./error/CannotSetNamingStrategyError";
import {ConnectionArray} from "./ConnectionArray";

/**
 * Connection manager holds all connections made to the databases and providers helper management functions 
 * for all exist connections.
 */
export class ConnectionManager {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connections = new ConnectionArray();
    private _entityMetadataBuilder: EntityMetadataBuilder;
    private _namingStrategy: NamingStrategy;
    private _container: { get(someClass: any): any };

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Sets a container that can be used in custom user subscribers. This allows to inject services in subscribers.
     */
    set container(container: { get(someClass: Function): any }) {
        this._container = container;
    }

    /**
     * Sets the naming strategy to be used instead of DefaultNamingStrategy.
     */
    set namingStrategy(namingStrategy: NamingStrategy) {

        // if entity metadata builder already initialized then strategy already is used there, and setting a new naming
        // strategy is pointless
        if (this._entityMetadataBuilder)
            throw new CannotSetNamingStrategyError();

        this._namingStrategy = namingStrategy;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates and adds a new connection with given driver.
     */
    createConnection(driver: Driver, options: ConnectionOptions): Connection;
    createConnection(name: string|undefined, driver: Driver, options: ConnectionOptions): Connection;
    createConnection(nameOrDriver: string|undefined|Driver, driverOrOptions?: Driver|ConnectionOptions, maybeOptions?: ConnectionOptions): Connection {
        const name = typeof nameOrDriver === "string" ? nameOrDriver : "default";
        const driver = typeof nameOrDriver === "object" ? <Driver> nameOrDriver : <Driver> driverOrOptions;
        const options = typeof nameOrDriver === "object" ? <ConnectionOptions> driverOrOptions : <ConnectionOptions> maybeOptions;

        return this.connections.createAndPush(name, driver, options);
    }

    /**
     * Gets registered connection with the given name. If connection name is not given then it will get a default
     * connection.
     */
    getConnection(name: string = "default"): Connection {
        if (!name) name = "default";
        
        if (!this.connections.hasWithName(name))
            throw new ConnectionNotFoundError(name);

        return this.connections.getWithName(name);
    }

    /**
     * Imports entities from the given paths (directories) for the given connection. If connection name is not given
     * then default connection is used.
     */
    importEntitiesFromDirectories(paths: string[]): void;
    importEntitiesFromDirectories(connectionName: string|undefined, paths: string[]): void;
    importEntitiesFromDirectories(connectionNameOrPaths: string|string[]|undefined, maybePaths?: string[]): void {
        const connectionName = typeof connectionNameOrPaths === "string" ? connectionNameOrPaths : "default";
        const paths = maybePaths ? <string[]> maybePaths : <string[]> connectionNameOrPaths;

        this.importEntities(connectionName, importClassesFromDirectories(paths));
    }

    /**
     * Imports subscribers from the given paths (directories) for the given connection. If connection name is not given
     * then default connection is used.
     */
    importSubscribersFromDirectories(paths: string[]): void;
    importSubscribersFromDirectories(connectionName: string|undefined, paths: string[]): void;
    importSubscribersFromDirectories(connectionNameOrPaths: string|string[]|undefined, maybePaths?: string[]): void {
        const connectionName = typeof connectionNameOrPaths === "string" ? connectionNameOrPaths : "default";
        const paths = maybePaths ? <string[]> maybePaths : <string[]> connectionNameOrPaths;

        this.importSubscribers(connectionName, importClassesFromDirectories(paths));
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importEntities(entities: Function[]): void;
    importEntities(connectionName: string|undefined, entities: Function[]): void;
    importEntities(connectionNameOrEntities: string|undefined|Function[], maybeEntities?: Function[]): void {
        const connectionName = typeof connectionNameOrEntities === "string" ? connectionNameOrEntities : "default";
        const entities = maybeEntities ? <Function[]> maybeEntities : <Function[]> connectionNameOrEntities;
        
        // console.log("entities", entities);
        
        const entityMetadatas = this.entityMetadataBuilder.build(entities);
        const entityListenerMetadatas = defaultMetadataStorage.findEntityListenersForClasses(entities);

        this.getConnection(connectionName)
            .addEntityMetadatas(entityMetadatas)
            .addEntityListenerMetadatas(entityListenerMetadatas);
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importSubscribers(subscriberClasses: Function[]): void;
    importSubscribers(connectionName: string|undefined, subscriberClasses: Function[]): void;
    importSubscribers(connectionNameOrSubscriberClasses: string|undefined|Function[], maybeSubscriberClasses?: Function[]): void {
        const connectionName = typeof connectionNameOrSubscriberClasses === "string" ? connectionNameOrSubscriberClasses : "default";
        const subscriberClasses = maybeSubscriberClasses ? <Function[]> maybeSubscriberClasses : <Function[]> connectionNameOrSubscriberClasses;

        const subscribers = defaultMetadataStorage
            .findEventSubscribersForClasses(subscriberClasses)
            .map(metadata => this.createContainerInstance(metadata.target));

        this.getConnection(connectionName).addSubscribers(subscribers);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * We need to lazily initialize EntityMetadataBuilder because naming strategy can be set before we use entityMetadataBuilder.
     */
    private get entityMetadataBuilder() {
        if (!this._entityMetadataBuilder) {
            const namingStrategy = this._namingStrategy ? this._namingStrategy : new DefaultNamingStrategy();
            this._entityMetadataBuilder = new EntityMetadataBuilder(defaultMetadataStorage, namingStrategy);
        }

        return this._entityMetadataBuilder;
    }

    /**
     * Creates a new instance of the given constructor.
     */
    private createContainerInstance(constructor: Function) {
        return this._container ? this._container.get(constructor) : new (<any> constructor)();
    }

}
