/*!
 */

import {DriverOptions} from "./driver/DriverOptions";
import {ConnectionManager} from "./connection/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MysqlDriver} from "./driver/mysql/MysqlDriver";
import {MetadataArgsStorage} from "./metadata-args/MetadataArgsStorage";
import {ConnectionOptions} from "./connection/ConnectionOptions";
import {getFromContainer} from "./container";

// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------

export * from "./container";
export * from "./decorator/columns/Column";
export * from "./decorator/columns/PrimaryColumn";
export * from "./decorator/columns/CreateDateColumn";
export * from "./decorator/columns/UpdateDateColumn";
export * from "./decorator/relations/RelationCount";
export * from "./decorator/indices/Index";
export * from "./decorator/indices/CompositeIndex";
export * from "./decorator/listeners/EventSubscriber";
export * from "./decorator/listeners/AfterInsert";
export * from "./decorator/listeners/BeforeInsert";
export * from "./decorator/listeners/AfterUpdate";
export * from "./decorator/listeners/BeforeUpdate";
export * from "./decorator/listeners/AfterRemove";
export * from "./decorator/listeners/BeforeRemove";
export * from "./decorator/relations/OneToOne";
export * from "./decorator/relations/OneToMany";
export * from "./decorator/relations/ManyToOne";
export * from "./decorator/relations/ManyToMany";
export * from "./decorator/relations/JoinTable";
export * from "./decorator/relations/JoinColumn";
export * from "./decorator/relations/RelationCount";
export * from "./decorator/relations/RelationId";
export * from "./decorator/tables/Table";
export * from "./decorator/tables/AbstractTable";
export * from "./decorator/tree/TreeLevelColumn";
export * from "./decorator/tree/TreeParent";

export {Connection} from "./connection/Connection";
export {DriverOptions} from "./driver/DriverOptions";
export {ConnectionManager} from "./connection/ConnectionManager";
export {ConnectionOptions} from "./connection/ConnectionOptions";
export {Driver} from "./driver/Driver";
export {MysqlDriver} from "./driver/mysql/MysqlDriver";
export {QueryBuilder} from "./query-builder/QueryBuilder";
export {EntityManager} from "./entity-manager/EntityManager";
export {Repository} from "./repository/Repository";
export {FindOptions} from "./repository/FindOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EntitySubscriberInterface} from "./subscriber/EntitySubscriberInterface";

// -------------------------------------------------------------------------
// Commonly used functionality
// -------------------------------------------------------------------------

/**
 * Gets metadata args storage.
 */
export function getMetadataArgsStorage() {
    return getFromContainer(MetadataArgsStorage);
}

/**
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager() {
    return getFromContainer(ConnectionManager);
}

/**
 * Allows to quickly create a connection based on the given options. Uses ConnectionManager.
 */
export function createConnection(options: ConnectionOptions) {
    return getConnectionManager().createAndConnect(options);
}