/**
 * This event is used on update events.
 */
export interface UpdateEvent<Entity> {

    entity?: Entity;
    options?: any;
    conditions?: any;

}