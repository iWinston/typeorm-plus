/*!
 
 */

import {ConnectionOptions} from "./connection/ConnectionOptions";
import {ConnectionManager} from "./connection-manager/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MysqlDriver} from "./driver/MysqlDriver";
import {MetadataArgsStorage} from "./metadata-storage/MetadataStorage";
import {CreateConnectionOptions} from "./connection-manager/CreateConnectionOptions";

// -------------------------------------------------------------------------
// Global Container
// -------------------------------------------------------------------------

/**
 * Container to be used by this library for inversion control. If container was not implicitly set then by default
 * container simply creates a new instance of the given class.
 */
let container: { get<T>(someClass: { new (...args: any[]): T }|Function): T } = new (class {
    private instances: any[] = [];
    get<T>(someClass: { new (...args: any[]): T }): T {
        if (!this.instances[<any>someClass])
            this.instances[<any>someClass] = new someClass();

        return this.instances[<any>someClass];
    }
})();

/**
 * Sets container to be used by this library.
 *
 * @param iocContainer
 */
export function useContainer(iocContainer: { get(someClass: any): any }) {
    container = iocContainer;
}

/**
 * Gets the IOC container used by this library.
 */
export function getFromContainer<T>(someClass: { new (...args: any[]): T }|Function): T {
    return container.get<T>(someClass);
}

// -------------------------------------------------------------------------
// Global Metadata Storage
// -------------------------------------------------------------------------

/**
 * Default metadata storage used as singleton and can be used to storage all metadatas in the system.
 */
let metadataArgsStorage: MetadataArgsStorage;

/**
 * Gets metadata args storage.
 */
export function getMetadataArgsStorage() {
    if (!metadataArgsStorage && container) {
        metadataArgsStorage = container.get(MetadataArgsStorage);
        
    } else if (!metadataArgsStorage) {
        metadataArgsStorage = new MetadataArgsStorage();
    }
    
    return metadataArgsStorage;
}

// -------------------------------------------------------------------------
// Global Connection Manager
// -------------------------------------------------------------------------

/**
 * Default export. Global connection manager.
 */
let connectionManager: ConnectionManager;

/**
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager() {
    if (!connectionManager && container) {
        connectionManager = container.get(ConnectionManager);

    } else if (!connectionManager) {
        connectionManager = new ConnectionManager();
    }

    return connectionManager;
}

/**
 * Allows to quickly create a connection based on the given options. Uses ConnectionManager.
 */
export function createConnection(options: CreateConnectionOptions) {
    return getConnectionManager().create(options);
}

// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------

export {Connection} from "./connection/Connection";
export {ConnectionOptions} from "./connection/ConnectionOptions";
export {ConnectionManager} from "./connection-manager/ConnectionManager";
export {CreateConnectionOptions} from "./connection-manager/CreateConnectionOptions";
export {Driver} from "./driver/Driver";
export {MysqlDriver} from "./driver/MysqlDriver";
export {QueryBuilder} from "./query-builder/QueryBuilder";
export {EntityManager} from "./entity-manager/EntityManager";
export {Repository} from "./repository/Repository";
export {FindOptions} from "./repository/FindOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EventSubscriberInterface} from "./subscriber/EventSubscriberInterface";