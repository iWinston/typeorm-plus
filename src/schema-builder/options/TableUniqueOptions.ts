import {Table} from "../table/Table";

/**
 * Database's table unique constraint options.
 */
export interface TableUniqueOptions {

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
     * Columns that contains this constraint.
     */
    columnNames: string[];

}