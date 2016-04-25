/**
 * Contains metadata information about ORM event subscribers.
 *
 * @internal
 */
export class EventSubscriberMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
    readonly target: Function;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function) {
        this.target = target;
    }

}