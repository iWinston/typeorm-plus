/**
 */
export class OrmEventSubscriberMetadata {

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    private _target: Function;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function) {
        this._target = target;
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

}