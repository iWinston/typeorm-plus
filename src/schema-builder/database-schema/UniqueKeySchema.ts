/**
 * Unique key from the database stored in this class.
 */
export class UniqueKeySchema {

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
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this unique key with exactly same properties.
     */
    clone() {
        return new UniqueKeySchema(this.name);
    }

}