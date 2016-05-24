import {EventListenerType} from "../types/EventListenerTypes";

/**
 */
export interface EntityListenerMetadataArgs {

    /**
     * Class to which this column is applied.
     */
    target: Function;

    /**
     * Class's property name to which this column is applied.
     */
    propertyName: string;

    /**
     * The type of the listener.
     */
    type: EventListenerType;
    
}
