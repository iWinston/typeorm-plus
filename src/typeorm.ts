/*!
 
 */

import {ConnectionOptions} from "./connection/ConnectionOptions";
import {ConnectionManager} from "./connection-manager/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MysqlDriver} from "./driver/MysqlDriver";
import {MetadataStorage} from "./metadata-builder/MetadataStorage";
import {CreateConnectionOptions} from "./connection-manager/CreateConnectionOptions";

// -------------------------------------------------------------------------
// Global Container
// -------------------------------------------------------------------------

/**
 * Container to be used by TypeORM for inversion control.
 */
let container: { get(someClass: any): any };

/**
 * Sets container to be used by TypeORM.
 * 
 * @param iocContainer
 */
export function useContainer(iocContainer: { get(someClass: any): any }) {
    container = iocContainer;
}

export function getContainer() {
    return container;
}

// -------------------------------------------------------------------------
// Global Metadata Storage
// -------------------------------------------------------------------------

/**
 * Default metadata storage used as singleton and can be used to storage all metadatas in the system.
 */
let metadataStorage: MetadataStorage;

export function defaultMetadataStorage() {
    if (!metadataStorage && container) {
        metadataStorage = container.get(MetadataStorage);
        
    } else if (!metadataStorage) {
        metadataStorage = new MetadataStorage();
    }
    
    return metadataStorage;
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
export {EntityManager} from "./repository/EntityManager";
export {Repository} from "./repository/Repository";
export {FindOptions} from "./repository/FindOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EventSubscriberInterface} from "./subscriber/EventSubscriberInterface";