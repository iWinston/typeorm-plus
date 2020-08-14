import {FindOneOptions} from "./FindOneOptions";

/**
 * Defines a special criteria to find specific entities.
 */
export interface FindManyOptions<Entity = any> extends FindOneOptions<Entity> {

    /**
     * Offset (paginated) where from entities should be taken.
     */
    skip?: number;

    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number;

    /**
     * Offset page (paginated) where from entities should be taken.
     */
    current?: number;

    /**
     * Alias name for take, just effected for the conditions that current and size are both defined
     */
    size?: number;

}
