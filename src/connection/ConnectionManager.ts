import {Connection} from "./Connection";
import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {Driver} from "../driver/Driver";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {importClassesFromDirectories} from "../util/DirectoryExportedClassesLoader";

/**
 * Connection manager holds all connections made to the databases and providers helper management functions 
 * for all exist connections.
 */
export class ConnectionManager {
    
    // todo: inject naming strategy, make it configurable

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connections: Connection[] = [];
    private entityMetadataBuilder: EntityMetadataBuilder;
    private _container: { get(someClass: any): any };

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        this.entityMetadataBuilder = new EntityMetadataBuilder(defaultMetadataStorage, new DefaultNamingStrategy());
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Sets a container that can be used in custom user subscribers. This allows to inject services in user classes.
     */
    set container(container: { get(someClass: Function): any }) {
        this._container = container;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates and adds a new connection with given driver.
     */
    addConnection(driver: Driver): void;
    addConnection(name: string, driver: Driver): void;
    addConnection(name: any, driver?: Driver): void {
        if (typeof name === "object") {
            driver = <Driver> name;
            name = "default";
        }
        this.connections.push(new Connection(name, driver));
    }

    /**
     * Gets registered connection with the given name. If connection name is not given then it will get a default
     * connection.
     */
    getConnection(name: string = "default"): Connection {
        const foundConnection = this.connections.find(connection => connection.name === name);
        if (!foundConnection)
            throw new ConnectionNotFoundError(name);

        return foundConnection;
    }

    /**
     * Imports entities from the given paths (directories) for the given connection. If connection name is not given
     * then default connection is used.
     */
    importEntitiesFromDirectories(paths: string[]): void;
    importEntitiesFromDirectories(connectionName: string, paths: string[]): void;
    importEntitiesFromDirectories(connectionNameOrPaths: string|string[], paths?: string[]): void {
        let connectionName = "default";
        if (typeof connectionNameOrPaths === "string") {
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
        if (typeof connectionNameOrPaths === "string") {
            connectionName = <string> connectionNameOrPaths;
        } else {
            paths = <string[]> connectionNameOrPaths;
        }

        const allSubscriberClasses = importClassesFromDirectories(paths);
        const subscribers = defaultMetadataStorage
            .findOrmEventSubscribersForClasses(allSubscriberClasses)
            .map(metadata => this.createContainerInstance(metadata.constructor));

        this.getConnection(connectionName).addSubscribers(subscribers);
    }

    /**
     * Imports entities for the given connection. If connection name is not given then default connection is used.
     */
    importEntities(entities: Function[]): void;
    importEntities(connectionName: string, entities: Function[]): void;
    importEntities(connectionNameOrEntities: string|Function[], entities?: Function[]): void {
        let connectionName = "default";
        if (typeof connectionNameOrEntities === "string") {
            connectionName = <string> connectionNameOrEntities;
        } else {
            entities = <Function[]> connectionNameOrEntities;
        }

        const metadatas = this.entityMetadataBuilder.build(entities);
        this.getConnection(connectionName).addMetadatas(metadatas);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createContainerInstance(constructor: Function) {
        return this._container ? this._container.get(constructor) : new (<any> constructor)();
    }

}
