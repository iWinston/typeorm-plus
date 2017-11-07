import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {EventListenerTypes} from "../metadata/types/EventListenerTypes";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Subject} from "../persistence/Subject";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class Broadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcasts "BEFORE_INSERT", "BEFORE_UPDATE", "BEFORE_REMOVE" events for all given subjects.
     */
    async broadcastBeforeEventsForAll(queryRunner: QueryRunner, insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]): Promise<void> {
        const insertPromises = insertSubjects.map(subject => this.broadcastBeforeInsertEvent(queryRunner, subject));
        const updatePromises = updateSubjects.map(subject => this.broadcastBeforeUpdateEvent(queryRunner, subject));
        const removePromises = removeSubjects.map(subject => this.broadcastBeforeRemoveEvent(queryRunner, subject));
        const allPromises = insertPromises.concat(updatePromises).concat(removePromises);
        await Promise.all(allPromises);
    }

    /**
     * Broadcasts "AFTER_INSERT", "AFTER_UPDATE", "AFTER_REMOVE" events for all given subjects.
     */
    async broadcastAfterEventsForAll(queryRunner: QueryRunner, insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]): Promise<void> {
        const insertPromises = insertSubjects.map(subject => this.broadcastAfterInsertEvent(queryRunner, subject));
        const updatePromises = updateSubjects.map(subject => this.broadcastAfterUpdateEvent(queryRunner, subject));
        const removePromises = removeSubjects.map(subject => this.broadcastAfterRemoveEvent(queryRunner, subject));
        const allPromises = insertPromises.concat(updatePromises).concat(removePromises);
        await Promise.all(allPromises);
    }

    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeInsertEvent(queryRunner: QueryRunner, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_INSERT && listener.isAllowed(subject.entity!))
            .map(entityListener => subject.entity![entityListener.propertyName]()); // getValue() ?

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.metadata.target!) && subscriber.beforeInsert)
            .map(subscriber => subscriber.beforeInsert!({
                connection: queryRunner.connection,
                queryRunner: queryRunner,
                manager: queryRunner.manager,
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
    async broadcastBeforeUpdateEvent(queryRunner: QueryRunner, subject: Subject): Promise<void> { // todo: send relations too?

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_UPDATE && listener.isAllowed(subject.entity!))
            .map(entityListener => subject.entity![entityListener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.metadata.target!) && subscriber.beforeUpdate)
            .map(subscriber => subscriber.beforeUpdate!({
                connection: queryRunner.connection,
                queryRunner: queryRunner,
                manager: queryRunner.manager,
                entity: subject.entity,
                databaseEntity: subject.databaseEntity,
                updatedColumns: [], // todo: subject.diffColumns,
                updatedRelations: [] // subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeRemoveEvent(queryRunner: QueryRunner, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_REMOVE && listener.isAllowed(subject.entity!))
            .map(entityListener => subject.databaseEntity![entityListener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.metadata.target!) && subscriber.beforeRemove)
            .map(subscriber => subscriber.beforeRemove!({
                connection: queryRunner.connection,
                queryRunner: queryRunner,
                manager: queryRunner.manager,
                entity: subject.entity,
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
    async broadcastAfterInsertEvent(queryRunner: QueryRunner, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_INSERT && listener.isAllowed(subject.entity!))
            .map(entityListener => subject.entity![entityListener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.metadata.target!) && subscriber.afterInsert)
            .map(subscriber => subscriber.afterInsert!({
                connection: queryRunner.connection,
                queryRunner: queryRunner,
                manager: queryRunner.manager,
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
    async broadcastAfterUpdateEvent(queryRunner: QueryRunner, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_UPDATE && listener.isAllowed(subject.entity!))
            .map(entityListener => subject.entity![entityListener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.metadata.target!) && subscriber.afterUpdate)
            .map(subscriber => subscriber.afterUpdate!({
                connection: queryRunner.connection,
                queryRunner: queryRunner,
                manager: queryRunner.manager,
                entity: subject.entity,
                databaseEntity: subject.databaseEntity,
                updatedColumns: [], // todo: subject.diffColumns,
                updatedRelations: [] // todo: subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterRemoveEvent(queryRunner: QueryRunner, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_REMOVE && listener.isAllowed(subject.entity!))
            .map(entityListener => subject.entity![entityListener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.metadata.target!) && subscriber.afterRemove)
            .map(subscriber => subscriber.afterRemove!({
                connection: queryRunner.connection,
                queryRunner: queryRunner,
                manager: queryRunner.manager,
                entity: subject.entity,
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

        const listeners = this.connection.getMetadata(target).listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD && listener.isAllowed(entity))
            .map(listener => entity[listener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, target) && subscriber.afterLoad)
            .map(subscriber => subscriber.afterLoad!(entity));

        await Promise.all(children.concat(listeners.concat(subscribers)));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

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