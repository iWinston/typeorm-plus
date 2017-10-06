import {EntitySchemaTable} from "./EntitySchemaTable";
import {EntitySchemaIndex} from "./EntitySchemaIndex";
import {EntitySchemaColumn} from "./EntitySchemaColumn";
import {EntitySchemaRelation} from "./EntitySchemaRelation";

/**
 * Interface for entity metadata mappings stored inside "schemas" instead of models decorated by decorators.
 */
export interface EntitySchema { // todo: make it-to-date

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
    table?: EntitySchemaTable;

    /**
     * Entity column's options.
     */
    columns: {
        [columnName: string]: EntitySchemaColumn 
    };

    /**
     * Entity relation's options.
     */
    relations?: {
        [relationName: string]: EntitySchemaRelation;
    };

    /**
    * Entity indices options.
    */
    indices?: {
        [indexName: string]: EntitySchemaIndex;
    };

}