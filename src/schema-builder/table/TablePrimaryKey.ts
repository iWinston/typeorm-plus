import {TablePrimaryKeyOptions} from "../options/TablePrimaryKeyOptions";
import {Table} from "./Table";

/**
 * Primary key from the database stored in this class.
 */
export class TablePrimaryKey {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table that contains this primary key.
     */
    table: Table;

    /**
     * Key name.
     */
    name: string;

    /**
     * Columns to which this primary key is bind.
     */
    columnNames: string[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TablePrimaryKeyOptions) {
        this.table = options.table;
        this.name = options.name;
        this.columnNames = options.columnNames;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this primary key with exactly same properties.
     */
    clone(): TablePrimaryKey {
        return new TablePrimaryKey(<TablePrimaryKeyOptions>{
            table: this.table,
            name: this.name,
            columnNames: this.columnNames
        });
    }

}