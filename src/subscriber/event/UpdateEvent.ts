import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * UpdateEvent is an object that broadcaster sends to the entity subscriber when entity is being updated in the database.
 */
export interface UpdateEvent<Entity> {
    
    /**
     * Updating entity.
     */
    entity: Entity;

    /**
     * List of updating columns.
     */
    updatedColumns: ColumnMetadata[];

    // todo: send old and new update values
    // todo: send updated relations?

}