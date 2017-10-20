import {TableDefaultOptions} from "../options/TableDefaultOptions";

/**
 * Database's table default constraint stored in this class.
 */
export class TableDefault {

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

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableDefaultOptions) {
        this.name = options.name;
        this.columnName = options.columnName;
        this.definition = options.definition;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this default constraint with exactly same properties.
     */
    clone(): TableDefault {
        return new TableDefault(<TableDefaultOptions>{
            name: this.name,
            columnName: this.columnName,
            definition: this.definition
        });
    }

}