/**
 * Primary key from the database stored in this class.
 */
export class PrimaryKeySchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Key name.
     */
    name: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string) {
        this.name = name;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this primary key with exactly same properties.
     */
    clone() {
        return new PrimaryKeySchema(this.name);
    }

}