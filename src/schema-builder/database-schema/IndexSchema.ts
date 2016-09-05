/**
 * Database's table index stored in this class.
 */
export class IndexSchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Index name.
     */
    name: string;

    /**
     * Columns included in this index.
     */
    columnNames: string[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, columnNames: string[]) {
        this.name = name;
        this.columnNames = columnNames;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this index with exactly same properties.
     */
    clone() {
        return new IndexSchema(this.name, this.columnNames.map(name => name));
    }

}