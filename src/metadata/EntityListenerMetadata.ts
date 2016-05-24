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

    constructor(args: EntityListenerMetadataArgs) {
        super(args.target, args.propertyName);
        this.type = args.type;
    }


}