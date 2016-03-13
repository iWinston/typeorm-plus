import {Connection} from "./Connection";
import {OrmUtils} from "../util/OrmUtils";
import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {Driver} from "../driver/Driver";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {ConnectionNotFoundError} from "./error/ConnectionNotFoundError";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";

/**
 * Connection manager holds all connections made to the databases.
 */
export class ConnectionManager {

    // todo: add support for importing entities and subscribers from subdirectories, make support of glob patterns

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
    set container(container: { get(someClass: any): any }) {
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
        if (metadatas.length > 0)
            this.getConnection(connectionName).addMetadatas(metadatas);
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

        const entitiesInFiles = OrmUtils.requireAll(paths);
        const allEntities = entitiesInFiles.reduce((allEntities, entities) => {
            return allEntities.concat(Object.keys(entities).map(key => entities[key]));
        }, []);
        
        this.importEntities(connectionName, allEntities);
    }

    /**
     * Imports subscribers from the given paths (directories) for the given connection. If connection name is not given
     * then default connection is used.
     */
    importSubscribersFromDirectories(paths: string[]): void;
    importSubscribersFromDirectories(connectionName: string, paths: string[]): void;
    importSubscribersFromDirectories(connectionName: any, paths?: string[]): void {
        if (typeof connectionName === "object") {
            paths = connectionName;
            connectionName = "default";
        }

        const subscribersInFiles = OrmUtils.requireAll(paths);
        const allSubscriberClasses = subscribersInFiles.reduce((all, subscriberInFile) => {
            return all.concat(Object.keys(subscriberInFile).map(key => subscriberInFile[key]));
        }, []);

        const subscribers = defaultMetadataStorage
            .ormEventSubscriberMetadatas
            .filter(metadata => allSubscriberClasses.indexOf(metadata.constructor) !== -1)
            .map(metadata => {
                const constructor: any = metadata.constructor;
                return this._container ? this._container.get(constructor) : new constructor();
            });
        
        if (subscribers.length > 0)
            this.getConnection(connectionName).addSubscribers(subscribers);
    }

}
