import {UpdateEvent} from "./event/UpdateEvent";
import {RemoveEvent} from "./event/RemoveEvent";
import {InsertEvent} from "./event/InsertEvent";
import {OrmSubscriber} from "./OrmSubscriber";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class OrmBroadcaster<Entity> {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private subscribers: OrmSubscriber<Entity|any>[];
    private _entityClass: Function;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(subscribers: OrmSubscriber<Entity|any>[], entityClass: Function) {
        this.subscribers = subscribers;
        this._entityClass = entityClass;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get entityClass(): Function {
        return this._entityClass;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    broadcastBeforeInsert(event: InsertEvent<Entity>) {
        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.beforeInsert)
            .forEach(subscriber => subscriber.beforeInsert(event));
    }

    broadcastAfterInsert(event: InsertEvent<Entity>) {
        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.afterInsert)
            .forEach(subscriber => subscriber.afterInsert(event));
    }

    broadcastBeforeUpdate(event: UpdateEvent<Entity>) {
        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.beforeUpdate)
            .forEach(subscriber => subscriber.beforeUpdate(event));
    }

    broadcastAfterUpdate(event: UpdateEvent<Entity>) {
        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.afterUpdate)
            .forEach(subscriber => subscriber.afterUpdate(event));
    }

    broadcastAfterRemove(event: RemoveEvent<Entity>) {
        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.afterRemove)
            .forEach(subscriber => subscriber.afterRemove(event));
    }

    broadcastBeforeRemove(event: RemoveEvent<Entity>) {
        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.beforeRemove)
            .forEach(subscriber => subscriber.beforeRemove(event));
    }

    broadcastAfterLoadedAll(entities: Entity[]) {
        if (!entities || entities.length) return;

        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.afterLoad)
            .forEach(subscriber => {
                entities.forEach(entity => subscriber.afterLoad(entity));
            });
    }

    broadcastAfterLoaded(entity: Entity) {
        if (!entity) return;

        this.subscribers
            .filter(subscriber => this.isAllowedSubscribers(subscriber))
            .filter(subscriber => !!subscriber.afterLoad)
            .forEach(subscriber => subscriber.afterLoad(entity));
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private isAllowedSubscribers(subscriber: OrmSubscriber<Entity|any>) {
        return !subscriber.listenTo() || subscriber.listenTo() === Object || subscriber.listenTo() === this._entityClass;
    }

}