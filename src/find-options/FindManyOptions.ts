import {FindOneOptions} from "./FindOneOptions";

/**
 * Defines a special criteria to find specific entities.
 */
export interface FindManyOptions<Entity> extends FindOneOptions<Entity> {

    /**
     * Offset (paginated) where from entities should be taken.
     */
    from?: number;

    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number;

}
