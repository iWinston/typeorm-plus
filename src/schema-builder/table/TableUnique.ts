import {Table} from "./Table";
import {TableUniqueOptions} from "../options/TableUniqueOptions";

/**
 * Database's table unique constraint stored in this class.
 */
export class TableUnique {

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
    columnNames: string[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableUniqueOptions) {
        this.table = options.table;
        this.name = options.name;
        this.columnNames = options.columnNames;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    clone(): TableUnique {
        return new TableUnique(<TableUniqueOptions>{
            table: this.table,
            name: this.name,
            columnNames: this.columnNames,
        });
    }

}