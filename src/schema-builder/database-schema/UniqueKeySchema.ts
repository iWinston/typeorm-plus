/**
 * Unique key from the database stored in this class.
 */
export class UniqueKeySchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table name that contains this unique index.
     */
    tableName: string;

    /**
     * Key name.
     */
    name: string;

    /**
     * Column names of this index.
     */
    columns: string[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(tableName: string, name: string, columns: string[]) {
        this.tableName = tableName;
        this.name = name;
        this.columns = columns;
    }

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this unique key with exactly same properties.
     */
    clone() {
        return new UniqueKeySchema(this.tableName, this.name, this.columns.map(name => name));
    }

}