import {Table} from "../table/Table";

/**
 * Database's table default constraint options.
 */
export interface TableDefaultOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table that contains this constraint.
     */
    table: Table;

    /**
     * Constraint name.
     */
    name: string;

    /**
     * Column that contains this constraint.
     */
    columnName: string;

    /**
     * Column default value.
     */
    definition: string;

}