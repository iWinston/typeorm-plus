import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * This event is used on update events.
 */
export interface UpdateEvent<Entity> {

    // todo: send old and new update values
    
    /**
     * Updated entity.
     */
    entity: Entity;

    /**
     * List of columns that were updated.
     */
    updatedColumns: ColumnMetadata[];

}