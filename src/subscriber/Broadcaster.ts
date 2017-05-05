import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {EventListenerTypes} from "../metadata/types/EventListenerTypes";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Subject} from "../persistence/Subject";
import {Connection} from "../connection/Connection";
import {EntityManager} from "../entity-manager/EntityManager";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class Broadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection,
                private subscriberMetadatas: EntitySubscriberInterface<any>[],
                private entityListeners: EntityListenerMetadata[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcasts "BEFORE_INSERT", "BEFORE_UPDATE", "BEFORE_REMOVE" events for all given subjects.
     */
    async broadcastBeforeEventsForAll(entityManager: EntityManager, insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]): Promise<void> {
        const insertPromises = insertSubjects.map(subject => this.broadcastBeforeInsertEvent(entityManager, subject));
        const updatePromises = updateSubjects.map(subject => this.broadcastBeforeUpdateEvent(entityManager, subject));
        const removePromises = removeSubjects.map(subject => this.broadcastBeforeRemoveEvent(entityManager, subject));
        const allPromises = insertPromises.concat(updatePromises).concat(removePromises);
        await Promise.all(allPromises);
    }

    /**
     * Broadcasts "AFTER_INSERT", "AFTER_UPDATE", "AFTER_REMOVE" events for all given subjects.
     */
    async broadcastAfterEventsForAll(entityManager: EntityManager, insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]): Promise<void> {
        const insertPromises = insertSubjects.map(subject => this.broadcastAfterInsertEvent(entityManager, subject));
        const updatePromises = updateSubjects.map(subject => this.broadcastAfterUpdateEvent(entityManager, subject));
        const removePromises = removeSubjects.map(subject => this.broadcastAfterRemoveEvent(entityManager, subject));
        const allPromises = insertPromises.concat(updatePromises).concat(removePromises);
        await Promise.all(allPromises);
    }

    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeInsertEvent(entityManager: EntityManager, subject: Subject): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_INSERT && this.isAllowedListener(listener, subject.entity))
            .map(entityListener => subject.entity[entityListener.propertyName]()); // getValue() ?

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.beforeInsert)
            .map(subscriber => subscriber.beforeInsert!({
                entityManager: entityManager,
                entity: subject.entity
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_UPDATE" event.
     * Before update event is executed before entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeUpdateEvent(entityManager: EntityManager, subject: Subject): Promise<void> { // todo: send relations too?

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_UPDATE && this.isAllowedListener(listener, subject.entity))
            .map(entityListener => subject.entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.beforeUpdate)
            .map(subscriber => subscriber.beforeUpdate!({
                entityManager: entityManager,
                entity: subject.entity,
                databaseEntity: subject.databaseEntity,
                updatedColumns: subject.diffColumns,
                updatedRelations: subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeRemoveEvent(entityManager: EntityManager, subject: Subject): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_REMOVE && this.isAllowedListener(listener, subject.entity))
            .map(entityListener => subject.databaseEntity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.beforeRemove)
            .map(subscriber => subscriber.beforeRemove!({
                entityManager: entityManager,
                entity: subject.hasEntity ? subject.entity : undefined,
                databaseEntity: subject.databaseEntity,
                entityId: subject.metadata.getEntityIdMixedMap(subject.databaseEntity)
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_INSERT" event.
     * After insert event is executed after entity is being persisted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterInsertEvent(entityManager: EntityManager, subject: Subject): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_INSERT && this.isAllowedListener(listener, subject.entity))
            .map(entityListener => subject.entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.afterInsert)
            .map(subscriber => subscriber.afterInsert!({
                entityManager: entityManager,
                entity: subject.entity
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_UPDATE" event.
     * After update event is executed after entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterUpdateEvent(entityManager: EntityManager, subject: Subject): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_UPDATE && this.isAllowedListener(listener, subject.entity))
            .map(entityListener => subject.entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.afterUpdate)
            .map(subscriber => subscriber.afterUpdate!({
                entityManager: entityManager,
                entity: subject.entity,
                databaseEntity: subject.databaseEntity,
                updatedColumns: subject.diffColumns,
                updatedRelations: subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterRemoveEvent(entityManager: EntityManager, subject: Subject): Promise<void> {

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_REMOVE && this.isAllowedListener(listener, subject.entity))
            .map(entityListener => subject.entity[entityListener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.afterRemove)
            .map(subscriber => subscriber.afterRemove!({
                entityManager: entityManager,
                entity: subject.hasEntity ? subject.entity : undefined,
                databaseEntity: subject.databaseEntity,
                entityId: subject.metadata.getEntityIdMixedMap(subject.databaseEntity)
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_LOAD" event for all given entities, and their sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastLoadEventsForAll(target: Function|string, entities: ObjectLiteral[]): Promise<void> {
        await Promise.all(entities.map(entity => this.broadcastLoadEvents(target, entity)));
    }

    /**
     * Broadcasts "AFTER_LOAD" event for the given entity and all its sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastLoadEvents(target: Function|string, entity: ObjectLiteral): Promise<void> {
        if (entity instanceof Promise) // todo: check why need this?
            return;

        // collect load events for all children entities that were loaded with the main entity
        const children = this.connection.getMetadata(target).relations.reduce((promises, relation) => {
            if (!entity.hasOwnProperty(relation.propertyName))
                return promises;

            const value = relation.getEntityValue(entity);
            if (value instanceof Array) {
                promises = promises.concat(this.broadcastLoadEventsForAll(relation.inverseEntityMetadata.target!, value));
            } else if (value) {
                promises.push(this.broadcastLoadEvents(relation.inverseEntityMetadata.target!, value));
            }

            return promises;
        }, [] as Promise<void>[]);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD && this.isAllowedListener(listener, entity))
            .map(listener => entity[listener.propertyName]());

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscriber(subscriber, target) && subscriber.afterLoad)
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
        // todo: create in entity metadata method like isInherited
        return listener.target === entity.constructor || // todo: .constructor won't work for entity schemas
            (listener.target instanceof Function && entity.constructor.prototype instanceof listener.target); // todo: also need to implement entity schema inheritance
    }

    /**
     * Checks if subscriber's methods can be executed by checking if its don't listen to the particular entity,
     * or listens our entity.
     */
    protected isAllowedSubscriber(subscriber: EntitySubscriberInterface<any>, target: Function|string): boolean {
        return  !subscriber.listenTo ||
                !subscriber.listenTo() ||
                subscriber.listenTo() === Object ||
                subscriber.listenTo() === target;
    }

}