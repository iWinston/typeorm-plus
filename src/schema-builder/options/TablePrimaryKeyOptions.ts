import {TableColumn} from "../table/TableColumn";
import {Table} from "../table/Table";

/**
 * Table primary key options
 */
export interface TablePrimaryKeyOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table that contains this primary key.
     */
    table: Table;

    /**
     * Constraint name.
     */
    name: string;

    /**
     * Columns to which this primary key is bind.
     */
    columns: TableColumn[];

}