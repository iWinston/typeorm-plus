import {EntitySchemaTableOptions} from "./EntitySchemaTableOptions";
import {EntitySchemaIndexOptions} from "./EntitySchemaIndexOptions";
import {EntitySchemaColumnOptions} from "./EntitySchemaColumnOptions";
import {EntitySchemaRelationOptions} from "./EntitySchemaRelationOptions";

/**
 * Interface for entity metadata mappings stored inside "schemas" instead of models decorated by decorators.
 */
export class EntitySchemaOptions<T> {

    /**
     * Name of the schema it extends.
     */
    extends?: string;

    /**
     * Target bind to this entity schema. Optional.
     */
    target?: Function;

    /**
     * Entity name.
     */
    name: string;

    /**
     * Entity table's options.
     */
    table?: EntitySchemaTableOptions;

    /**
     * Entity column's options.
     */
    columns: {
        [P in keyof T]?: EntitySchemaColumnOptions;
    };

    /**
     * Entity relation's options.
     */
    relations?: {
        [P in keyof T]?: EntitySchemaRelationOptions;
    };

    /**
    * Entity indices options.
    */
    indices?: {
        [indexName: string]: EntitySchemaIndexOptions;
    };

}