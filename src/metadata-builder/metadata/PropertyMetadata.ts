/**
 * This represents metadata of some object's property.
 */
export abstract class PropertyMetadata {

    // ---------------------------------------------------------------------
    // Properties
    // ---------------------------------------------------------------------

    /**
     * Class to which this decorator is applied.
     */
    private _target: Function;

    /**
     * Class's property name to which this decorator is applied.
     */
    private _propertyName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target?: Function, propertyName?: string) {
        if (target)
            this._target = target;
        
        if (propertyName)
            this._propertyName = propertyName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * The object class to which this metadata is attached.
     */
    get target() {
        return this._target;
    }

    /**
     * The name of the property of the object to which this metadata is attached.
     */
    get propertyName() {
        return this._propertyName;
    }

}