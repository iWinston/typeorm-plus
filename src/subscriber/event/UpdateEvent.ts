import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * UpdateEvent is an object that broadcaster sends to the entity subscriber when entity is being updated in the database.
 */
export interface UpdateEvent<Entity> {
    
    /**
     * Updating entity.
     */
    persistEntity: Entity;

    /**
     * Updating entity in the database.
     */
    databaseEntity: Entity;

    /**
     * List of updated columns.
     */
    updatedColumns: ColumnMetadata[];

    /**
     * List of updated relations.
     */
    updatedRelations: RelationMetadata[];

    // todo: send old and new update values
    // todo: send updated relations?

}