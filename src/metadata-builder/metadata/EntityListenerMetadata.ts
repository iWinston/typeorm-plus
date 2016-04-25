import {PropertyMetadata} from "./PropertyMetadata";
import {EventListenerType} from "../types/EventListenerTypes";

/**
 * This metadata interface contains all information about some index on a field.
 */
export class EntityListenerMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * The type of the listener.
     */
    readonly type: EventListenerType;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, type: EventListenerType) {
        super(target, propertyName);
        this.type = type;
    }


}