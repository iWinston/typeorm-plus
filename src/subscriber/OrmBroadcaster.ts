import {OrmSubscriber} from "./OrmSubscriber";
import {Connection} from "../connection/Connection";
import {ColumnMetadata} from "../metadata-builder/metadata/ColumnMetadata";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class OrmBroadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    broadcastBeforeInsertEvent(entity: any) {
        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.beforeInsert)
            .forEach(subscriber => subscriber.beforeInsert({ entity: entity }));
    }

    broadcastBeforeUpdateEvent(entity: any, updatedColumns: ColumnMetadata[]) {
        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.beforeUpdate)
            .forEach(subscriber => subscriber.beforeUpdate({ entity: entity, updatedColumns: updatedColumns }));
    }

    broadcastBeforeRemoveEvent(entity: any, entityId: any) {
        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.beforeRemove)
            .forEach(subscriber => subscriber.beforeRemove({ entity: entity, entityId: entityId }));
    }

    broadcastAfterInsertEvent(entity: any) {
        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterInsert)
            .forEach(subscriber => subscriber.afterInsert({ entity: entity }));
    }

    broadcastAfterUpdateEvent(entity: any, updatedColumns: ColumnMetadata[]) {
        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterUpdate)
            .forEach(subscriber => subscriber.afterUpdate({ entity: entity, updatedColumns: updatedColumns }));
    }

    broadcastAfterRemoveEvent(entity: any, entityId: any) {
        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterRemove)
            .forEach(subscriber => subscriber.afterRemove({ entity: entity, entityId: entityId }));
    }

    broadcastLoadEventsForAll(entities: any[]) {
        entities.forEach(entity => this.broadcastLoadEvents(entity));
    }

    broadcastLoadEvents(entity: any) {
        const metadata = this.connection.getMetadata(entity.constructor);

        metadata
            .relations
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .map(relation => entity[relation.propertyName])
            .forEach(value => value instanceof Array ? this.broadcastLoadEventsForAll(value) : this.broadcastLoadEvents(value));

        this.connection
            .subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterLoad)
            .forEach(subscriber => subscriber.afterLoad(entity));
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private isAllowedSubscribers(subscriber: OrmSubscriber<any>, cls: Function) {
        return  !subscriber.listenTo ||
                !subscriber.listenTo() ||
                subscriber.listenTo() === Object ||
                subscriber.listenTo() === cls;
    }

}