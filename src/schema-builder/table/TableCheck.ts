import {Table} from "./Table";
import {TableCheckOptions} from "../options/TableCheckOptions";

/**
 * Database's table check constraint stored in this class.
 */
export class TableCheck {

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

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableCheckOptions) {
        this.table = options.table;
        this.name = options.name;
        this.columnName = options.columnName;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    clone(): TableCheck {
        return new TableCheck(<TableCheckOptions>{
            table: this.table,
            name: this.name,
            columnName: this.columnName,
        });
    }

}