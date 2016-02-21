/**
 * This event is used on remove events.
 */
export interface RemoveEvent<Entity> {

    entity?: Entity;
    conditions?: any;
    entityId?: string;

}