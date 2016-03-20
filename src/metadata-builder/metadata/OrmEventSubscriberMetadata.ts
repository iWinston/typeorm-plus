/**
 * Contains metadata information about ORM event subscribers.
 */
export class OrmEventSubscriberMetadata {

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
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