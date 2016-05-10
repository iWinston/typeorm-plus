import {PropertyMetadata} from "./PropertyMetadata";

/**
 */
export class RelationsCountMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * The real reflected property type.
     */
    readonly relation: string|((object: any) => any);

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, relation: string|((object: any) => any)) {
        super(target, propertyName);
        this.relation = relation;
    }

}