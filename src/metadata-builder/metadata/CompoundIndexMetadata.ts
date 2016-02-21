/**
 * This metadata interface contains all information about compound index on a document.
 */
export class CompoundIndexMetadata {

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    private _target: Function;

    /**
     * Fields combination to be used as index.
     */
    private _fields: string[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, fields: string[]) {
        this._target = target;
        this._fields = fields;
    }

    // ---------------------------------------------------------------------
    // Getters
    // ---------------------------------------------------------------------

    /**
     * The object class to which this metadata is attached.
     */
    get target() {
        return this._target;
    }

    get fields() {
        return this._fields;
    }

}