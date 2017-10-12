import {Table} from "../table/Table";

/**
 * Database's table check constraint options.
 */
export interface TableCheckOptions {

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

}