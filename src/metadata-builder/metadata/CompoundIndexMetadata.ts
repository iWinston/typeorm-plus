/**
 * This metadata interface contains all information about table's compound index.
 */
export class CompoundIndexMetadata {

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
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

    /**
     * Fields combination to be used as index.
     */
    get fields() {
        return this._fields;
    }

}