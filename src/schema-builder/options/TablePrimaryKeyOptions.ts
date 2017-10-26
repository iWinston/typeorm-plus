/**
 * Table primary key options
 */
export interface TablePrimaryKeyOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string;

    /**
     * Columns to which this primary key is bind.
     */
    columnNames: string[];

}