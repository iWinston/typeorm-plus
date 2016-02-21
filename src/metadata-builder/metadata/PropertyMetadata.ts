/**
 * This represents metadata of some object's property.
 */
export abstract class PropertyMetadata {

    private _target: Function;
    private _propertyName: string;

    constructor(target: Function, propertyName: string) {
        this._target = target;
        this._propertyName = propertyName;
    }

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