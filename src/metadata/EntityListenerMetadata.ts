import {PropertyMetadata} from "./PropertyMetadata";
import {EventListenerType} from "./types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "./args/EntityListenerMetadataArgs";

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

    constructor(metadata: EntityListenerMetadataArgs) {
        super(metadata.target, metadata.propertyName);
        this.type = metadata.type;
    }


}