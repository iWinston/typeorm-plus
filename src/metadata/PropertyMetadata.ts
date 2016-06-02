import {TargetMetadata} from "./TargetMetadata";

/**
 * This represents metadata of some object's property.
 */
export class PropertyMetadata extends TargetMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function|string, propertyName?: string) {
        super(target);
        
        if (propertyName)
            this.propertyName = propertyName;
    }

}