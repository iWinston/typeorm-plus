/**
 * This represents metadata of some object's property.
 *
 * @internal
 */
export abstract class PropertyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
    readonly target: Function;

    /**
     * Class's property name to which this decorator is applied.
     */
    readonly propertyName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function, propertyName?: string) {
        if (target)
            this.target = target;
        
        if (propertyName)
            this.propertyName = propertyName;
    }

}