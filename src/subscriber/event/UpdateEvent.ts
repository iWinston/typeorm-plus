/**
 * This event is used on update events.
 */
export interface UpdateEvent<Entity> {
    
    // todo: will we send an entity changeset ?

    entity?: Entity;

}