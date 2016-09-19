/**
 * RemoveEvent is an object that broadcaster sends to the entity subscriber when entity is being removed to the database.
 */
export interface RemoveEvent<Entity> {

    /**
     * Entity that is being removed.
     */
    entity: Entity;

    /**
     * Id or ids of the entity that is being removed.
     */
    entityId?: any;

}