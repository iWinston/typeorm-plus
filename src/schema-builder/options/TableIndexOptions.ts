import {Table} from "../table/Table";

/**
 * Database's table index options.
 */
export interface TableIndexOptions {

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
     * Columns included in this index.
     */
    columnNames: string[];

    /**
     * Indicates if this index is unique.
     */
    isUnique: boolean;

}