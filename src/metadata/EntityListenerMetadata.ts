import {EventListenerType} from "./types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../metadata-args/EntityListenerMetadataArgs";

/**
 * This metadata contains all information about entity's listeners.
 */
export class EntityListenerMetadata {

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    /**
     * The type of the listener.
     */
    readonly type: EventListenerType;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: EntityListenerMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;
        this.type = args.type;
    }


}