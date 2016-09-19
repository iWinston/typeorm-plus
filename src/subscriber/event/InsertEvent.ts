/**
 * InsertEvent is an object that broadcaster sends to the entity subscriber when entity is inserted to the database.
 */
export interface InsertEvent<Entity> {

    /**
     * Inserting event.
     */
    entity: Entity;

}