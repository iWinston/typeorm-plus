/**
 * Primary key from the database stored in this class.
 */
import {TableColumn} from "./TableColumn";

export class TablePrimaryKey {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Key name.
     */
    name: string;

    /**
     * Columns to which this primary key is bind.
     */
    columns: TableColumn[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, columns: TableColumn[]) {
        this.name = name;
        this.columns = columns;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this primary key with exactly same properties.
     */
    clone() {
        return new TablePrimaryKey(this.name, this.columns);
    }

}