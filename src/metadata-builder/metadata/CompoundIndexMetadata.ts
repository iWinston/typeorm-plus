/**
 * This metadata interface contains all information about table's compound index.
 *
 * @internal
 */
export class CompoundIndexMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
    readonly target: Function;

    /**
     * Fields combination to be used as index.
     */
    readonly fields: string[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, fields: string[]) {
        this.target = target;
        this.fields = fields;
    }

}