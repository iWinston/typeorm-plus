import {PropertyMetadata} from "./PropertyMetadata";

/**
 * This metadata interface contains all information about some index on a field.
 */
export class IndexMetadata extends PropertyMetadata {

    /**
     * The name of the index.
     */
    name: string;
    
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, name?: string) {
        super(target, propertyName);
        this.name = name; // todo: if there is no name, then generate it
    }


}