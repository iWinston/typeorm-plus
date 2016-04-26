import {EventSubscriberInterface} from "./EventSubscriberInterface";
import {Connection} from "../connection/Connection";
import {ColumnMetadata} from "../metadata-builder/metadata/ColumnMetadata";
import {EventListenerTypes} from "../metadata-builder/types/EventListenerTypes";
import {EntityMetadata} from "../metadata-builder/metadata/EntityMetadata";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 * 
 * @internal
 */
export class Broadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection,
                private entityMetadatas: EntityMetadata[]) {
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    broadcastBeforeInsertEvent(entity: any): Promise<void> {

        const subscribers = this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.beforeInsert)
            .map(subscriber => subscriber.beforeInsert({ entity: entity }));

        const listeners = this.connection.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_INSERT)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastBeforeUpdateEvent(entity: any, updatedColumns: ColumnMetadata[]): Promise<void> {

        const subscribers = this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.beforeUpdate)
            .map(subscriber => subscriber.beforeUpdate({ entity: entity, updatedColumns: updatedColumns }));

        const listeners = this.connection.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_UPDATE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastBeforeRemoveEvent(entity: any, entityId: any): Promise<void> {

        const subscribers = this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.beforeRemove)
            .map(subscriber => subscriber.beforeRemove({ entity: entity, entityId: entityId }));

        const listeners = this.connection.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_REMOVE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastAfterInsertEvent(entity: any): Promise<void> {

        const subscribers = this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterInsert)
            .map(subscriber => subscriber.afterInsert({ entity: entity }));

        const listeners = this.connection.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_INSERT)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastAfterUpdateEvent(entity: any, updatedColumns: ColumnMetadata[]): Promise<void> {

        const subscribers = this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterUpdate)
            .map(subscriber => subscriber.afterUpdate({ entity: entity, updatedColumns: updatedColumns }));

        const listeners = this.connection.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_UPDATE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastAfterRemoveEvent(entity: any, entityId: any): Promise<void> {

        const subscribers = this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterRemove)
            .map(subscriber => subscriber.afterRemove({ entity: entity, entityId: entityId }));

        const listeners = this.connection.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_REMOVE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastLoadEvents(entity: any): Promise<void> {
        // const metadata = this.connection.getEntityMetadata(entity.constructor);
        const metadata = this.entityMetadatas.find(metadata => metadata.target === entity.constructor);
        let promises: Promise<any>[] = [];

        metadata
            .relations
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .map(relation => entity[relation.propertyName])
            .map(value => {
                if (value instanceof Array) {
                    promises = promises.concat(this.broadcastLoadEventsForAll(value));
                } else {
                    promises.push(this.broadcastLoadEvents(value));
                }
            });

        this.connection
            .subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .filter(subscriber => !!subscriber.afterLoad)
            .forEach(subscriber => promises.push(<any> subscriber.afterLoad(entity)));

        this.connection
            .entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD)
            .filter(listener => listener.target === entity.constructor)
            .forEach(listener => promises.push(<any> entity[listener.propertyName]()));

        return Promise.all(promises).then(() => {});
    }

    broadcastLoadEventsForAll(entities: any[]): Promise<void> {
        return Promise.all(entities.map(entity => this.broadcastLoadEvents(entity))).then(() => {});
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private isAllowedSubscribers(subscriber: EventSubscriberInterface<any>, cls: Function) {
        return  !subscriber.listenTo ||
                !subscriber.listenTo() ||
                subscriber.listenTo() === Object ||
                subscriber.listenTo() === cls;
    }

}