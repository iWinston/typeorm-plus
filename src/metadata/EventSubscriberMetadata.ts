import {TargetMetadata} from "./TargetMetadata";
import {EventSubscriberMetadataArgs} from "./args/EventSubscriberMetadataArgs";

/**
 * Contains metadata information about ORM event subscribers.
 */
export class EventSubscriberMetadata extends TargetMetadata {

    constructor(args: EventSubscriberMetadataArgs) {
        super(args.target);
    }
    
}