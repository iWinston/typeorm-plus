import {TargetMetadata} from "./TargetMetadata";

/**
 * This represents metadata of some object's property.
 */
export class PropertyMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Class's property name to which this decorator is applied.
     */
    readonly propertyName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function, propertyName?: string) {
        super(target);
        
        if (propertyName)
            this.propertyName = propertyName;
    }

}