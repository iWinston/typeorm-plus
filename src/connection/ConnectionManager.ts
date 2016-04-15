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
    createConnection(name: string, driver: Driver, options: ConnectionOptions): Connection;
    createConnection(nameOrDriver: string|Driver, driver?: Driver|ConnectionOptions, options?: ConnectionOptions): Connection {
        if (typeof nameOrDriver === "object") {
            driver = <Driver> nameOrDriver;
            options = <ConnectionOptions> driver;
        }
        const name = typeof nameOrDriver === "string" ? <string> nameOrDriver : "default";

        return this.connections.createAndPush(name, <Driver> driver, options);
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
    importEntitiesFromDirectories(connectionName: string, paths: string[]): void;
    importEntitiesFromDirectories(connectionNameOrPaths: string|string[], paths?: string[]): void {
        let connectionName = "default";
        if (paths) {
            connectionName = <string> connectionNameOrPaths;
        } else {
            paths = <string[]> connectionNameOrPaths;
        }

        this.importEntities(connectionName, importClassesFromDirectories(paths));
    }

    /**
     * Imports subscribers from the given paths (directories) for the given connection. If connection name is not given
     * then default connection is used.
     */
    importSubscribersFromDirectories(paths: string[]): void;
    importSubscribersFromDirectories(connectionName: string, paths: string[]): void;
    importSubscribersFromDirectories(connectionNameOrPaths: string|string[], paths?: string[]): void {
        let connectionName = "default";
        if (paths) {
            connectionName = <string> connectionNameOrPaths;
        } else {
            paths = <string[]> connectionNameOrPaths;
        }

        this.importSubscribers(connectionName, importClassesFromDirectories(paths));
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importEntities(entities: Function[]): void;
    importEntities(connectionName: string, entities: Function[]): void;
    importEntities(connectionNameOrEntities: string|Function[], entities?: Function[]): void {
        let connectionName = "default";
        if (entities) {
            connectionName = <string> connectionNameOrEntities;
        } else {
            entities = <Function[]> connectionNameOrEntities;
        }
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
    importSubscribers(connectionName: string, subscriberClasses: Function[]): void;
    importSubscribers(connectionNameOrSubscriberClasses: string|Function[], subscriberClasses?: Function[]): void {
        let connectionName = "default";
        if (subscriberClasses) {
            connectionName = <string> connectionNameOrSubscriberClasses;
        } else {
            subscriberClasses = <Function[]> connectionNameOrSubscriberClasses;
        }

        const subscribers = defaultMetadataStorage
            .findOrmEventSubscribersForClasses(subscriberClasses)
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
