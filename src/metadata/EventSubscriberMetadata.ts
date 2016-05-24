import {TargetMetadata} from "./TargetMetadata";

/**
 * Contains metadata information about ORM event subscribers.
 */
export class EventSubscriberMetadata extends TargetMetadata {

    constructor(metadata: EventSubscriberMetadata) {
        super(metadata.target);
    }
    
}