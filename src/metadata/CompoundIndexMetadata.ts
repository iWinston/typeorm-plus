import {TargetMetadata} from "./TargetMetadata";

/**
 * This metadata interface contains all information about table's compound index.
 */
export class CompoundIndexMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Fields combination to be used as index.
     */
    readonly fields: string[];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, fields: string[]) {
        super(target);
        this.fields = fields;
    }

}