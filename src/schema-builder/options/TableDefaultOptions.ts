/**
 * Database's table default constraint options.
 */
export interface TableDefaultOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

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