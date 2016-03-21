import {UpdateEvent} from "./event/UpdateEvent";
import {RemoveEvent} from "./event/RemoveEvent";
import {InsertEvent} from "./event/InsertEvent";

/**
 * Classes that implement this interface are subscribers that subscribe for the specific events of the ORM.
 */
export interface OrmSubscriber<Entity> {

    /**
     * Returns the class of the entity to which events will listen.
     */
    listenTo?(): Function;

    /**
     * Called after entity is loaded.
     */
    afterLoad?(entity: Entity): void;

    /**
     * Called before entity is inserted.
     */
    beforeInsert?(event: InsertEvent<Entity>): void;

    /**
     * Called after entity is inserted.
     */
    afterInsert?(event: InsertEvent<Entity>): void;

    /**
     * Called before entity is updated.
     */
    beforeUpdate?(event: UpdateEvent<Entity>): void;

    /**
     * Called after entity is updated.
     */
    afterUpdate?(event: UpdateEvent<Entity>): void;

    /**
     * Called before entity is replaced.
     */
    beforeRemove?(event: RemoveEvent<Entity>): void;

    /**
     * Called after entity is removed.
     */
    afterRemove?(event: RemoveEvent<Entity>): void;

}