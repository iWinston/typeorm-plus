import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {EventListenerTypes} from "../metadata/types/EventListenerTypes";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {RelationMetadata} from "../metadata/RelationMetadata";

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
    // Accessors
    // -------------------------------------------------------------------------

    broadcastBeforeInsertEvent(entity: any): Promise<void> {

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => !!subscriber)
            .map(subscriber => {
                if (subscriber.beforeInsert)
                    return subscriber.beforeInsert({ entity: entity });
            });

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_INSERT)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastBeforeUpdateEvent(entity: any, updatedColumns: ColumnMetadata[]): Promise<void> {

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .map(subscriber => {
                if (!subscriber.beforeUpdate)
                    return undefined;

                return subscriber.beforeUpdate({ entity: entity, updatedColumns: updatedColumns });
            })
            .filter(subscriber => !!subscriber);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_UPDATE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastBeforeRemoveEvent(entity: any, entityId: any): Promise<void> {

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .map(subscriber => {
                if (!subscriber.beforeRemove)
                    return undefined;

                return subscriber.beforeRemove({ entity: entity, entityId: entityId });
            })
            .filter(subscriber => !!subscriber);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_REMOVE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastAfterInsertEvent(entity: any): Promise<void> {

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .map(subscriber => {
                if (!subscriber.afterInsert)
                    return undefined;

                return subscriber.afterInsert({ entity: entity });
            })
            .filter(subscriber => !!subscriber);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_INSERT)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastAfterUpdateEvent(entity: any, updatedColumns: ColumnMetadata[]): Promise<void> {

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .map(subscriber => {
                if (!subscriber.afterUpdate)
                    return undefined;

                return subscriber.afterUpdate({ entity: entity, updatedColumns: updatedColumns });
            })
            .filter(subscriber => !!subscriber);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_UPDATE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastAfterRemoveEvent(entity: any, entityId: any): Promise<void> {

        const subscribers = this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .map(subscriber => {
                if (!subscriber.afterRemove)
                    return undefined;

                return subscriber.afterRemove({ entity: entity, entityId: entityId });
            })
            .filter(subscriber => !!subscriber);

        const listeners = this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_REMOVE)
            .filter(listener => listener.target === entity.constructor)
            .map(entityListener => entity[entityListener.propertyName]());

        return Promise.all(subscribers.concat(listeners)).then(() => {});
    }

    broadcastLoadEvents(target: Function|string, entity: any): Promise<void> {
        if (entity instanceof Promise) // todo: why need this?
            return Promise.resolve();
        
        const metadata = this.entityMetadatas.findByTarget(target);
        let promises: Promise<any>[] = [];

        metadata
            .relations
            .filter(relation => entity.hasOwnProperty(relation.propertyName))
            .map(relation => {
                const value = this.getEntityRelationValue(relation, entity);
                if (value instanceof Array) {
                    promises = promises.concat(this.broadcastLoadEventsForAll(relation.inverseEntityMetadata.target, value));
                } else if (value) {
                    promises.push(this.broadcastLoadEvents(relation.inverseEntityMetadata.target, value));
                }
            });

        this.subscriberMetadatas
            .filter(subscriber => this.isAllowedSubscribers(subscriber, entity))
            .forEach(subscriber => {
                if (subscriber.afterLoad)
                    promises.push(<any> subscriber.afterLoad(entity));
            });

        this.entityListeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD)
            .filter(listener => listener.target === entity.constructor)
            .forEach(listener => promises.push(<any> entity[listener.propertyName]()));

        return Promise.all(promises).then(() => {});
    }

    broadcastLoadEventsForAll(target: Function|string, entities: any[]): Promise<void> {
        const promises = entities.map(entity => this.broadcastLoadEvents(target, entity));
        return Promise.all(promises).then(() => {});
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private getEntityRelationValue(relation: RelationMetadata, entity: any) {
        return relation.isLazy ? entity["__" + relation.propertyName + "__"] : entity[relation.propertyName];
    }
    
    private isAllowedSubscribers(subscriber: EntitySubscriberInterface<any>, cls: Function) {
        return  !subscriber.listenTo ||
                !subscriber.listenTo() ||
                subscriber.listenTo() === Object ||
                subscriber.listenTo() === cls;
    }

}