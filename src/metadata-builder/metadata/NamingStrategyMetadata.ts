/**
 * This metadata interface contains all information about naming strategy.
 */
export class NamingStrategyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
    readonly target: Function;

    /**
     * Naming strategy name.
     */
    readonly name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, name: string) {
        this.target = target;
        this.name = name;
    }

}