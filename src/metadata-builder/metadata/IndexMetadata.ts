import {PropertyMetadata} from "./PropertyMetadata";

/**
 * This metadata interface contains all information about some index on a field.
 *
 * @internal
 */
export class IndexMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * The name of the index.
     */
    readonly name: string|undefined;
    
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, name?: string) {
        super(target, propertyName);
        this.name = name; // todo: if there is no name, then generate it
    }


}