import {PropertyMetadata} from "./PropertyMetadata";
import {EventListenerType} from "./types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../metadata-args/EntityListenerMetadataArgs";

/**
 * This metadata contains all information about entity's listeners.
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