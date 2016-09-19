import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {EventListenerTypes} from "../metadata/types/EventListenerTypes";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class Broadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private entityMetadatas: EntityMetadataCollection,
                private subscriberMetadatas: EntitySubscriberInterface<any>[],
                private entityListeners: EntityListenerMetadata[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeInsertEvent(entity: ObjectLiteral): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_INSERT && this.isAllowedListener(listener, entity))
            .map(entityListener => entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.beforeInsert)
            .map(subscriber => subscriber.beforeInsert!({ entity: entity }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_UPDATE" event.
     * Before update event is executed before entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeUpdateEvent(entity: ObjectLiteral, updatedColumns: ColumnMetadata[]): Promise<void> { // todo: send relations too?

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_UPDATE && this.isAllowedListener(listener, entity))
            .map(entityListener => entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.beforeUpdate)
            .map(subscriber => subscriber.beforeUpdate!({ entity: entity, updatedColumns: updatedColumns }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeRemoveEvent(entity: ObjectLiteral, entityId: any): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_REMOVE && this.isAllowedListener(listener, entity))
            .map(entityListener => entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.beforeRemove)
            .map(subscriber => subscriber.beforeRemove!({ entity: entity, entityId: entityId }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_INSERT" event.
     * After insert event is executed after entity is being persisted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterInsertEvent(entity: ObjectLiteral): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_INSERT && this.isAllowedListener(listener, entity))
            .map(entityListener => entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.afterInsert)
            .map(subscriber => subscriber.afterInsert!({ entity: entity }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_UPDATE" event.
     * After update event is executed after entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterUpdateEvent(entity: ObjectLiteral, updatedColumns: ColumnMetadata[]): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_UPDATE && this.isAllowedListener(listener, entity))
            .map(entityListener => entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.afterUpdate)
            .map(subscriber => subscriber.afterUpdate!({ entity: entity, updatedColumns: updatedColumns }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterRemoveEvent(entity: ObjectLiteral, entityId: any): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_REMOVE && this.isAllowedListener(listener, entity))
            .map(entityListener => entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.afterRemove)
            .map(subscriber => subscriber.afterRemove!({ entity: entity, entityId: entityId }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_LOAD" event for all given entities, and their sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastLoadEventsForAll(target: Function|string, entities: any[]): Promise<void> {
        await Promise.all(entities.map(entity => this.broadcastLoadEvents(target, entity)));
    }

    /**
     * Broadcasts "AFTER_LOAD" event for the given entity and all its sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastLoadEvents(target: Function|string, entity: any): Promise<void> {
        if (entity instanceof Promise) // todo: check why need this?
            return;

        // collect load events for all children entities that were loaded with the main entity
        const children = this.entityMetadatas.findByTarget(target).relations.reduce((promises, relation) => {
            if (!entity.hasOwnProperty(relation.propertyName))
                return promises;

            const value = relation.getEntityValue(entity);
            if (value instanceof Array) {
                promises = promises.concat(this.broadcastLoadEventsForAll(relation.inverseEntityMetadata.target, value));
            } else if (value) {
                promises.push(this.broadcastLoadEvents(relation.inverseEntityMetadata.target, value));
            }

            return promises;
        }, [] as Promise<void>[]);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD && this.isAllowedListener(listener, entity))
            .map(listener => entity[listener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, entity) && subscriber.afterLoad)
            .map(subscriber => subscriber.afterLoad!(entity));

        await Promise.all(children.concat(listeners.concat(subscribers)));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if entity listener is allowed to be executed on the given entity.
     */
    protected isAllowedListener(listener: EntityListenerMetadata, entity: ObjectLiteral) {
        return listener.target === entity.constructor || // todo: .constructor won't work for entity schemas
            (listener.target instanceof Function && entity.constructor.prototype instanceof listener.target); // todo: also need to implement entity schema inheritance
    }

    /**
     * Checks if subscriber's methods can be executed by checking if its don't listen to the particular entity,
     * or listens our entity.
     */
    protected isAllowedSubscriber(subscriber: EntitySubscriberInterface<any>, entity: ObjectLiteral): boolean {
        return  !subscriber.listenTo ||
                !subscriber.listenTo() ||
                subscriber.listenTo() === Object ||
                subscriber.listenTo() === entity.constructor;
    }

}