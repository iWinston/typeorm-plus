import {TargetMetadata} from "./TargetMetadata";
import {EntitySubscriberMetadataArgs} from "../metadata-args/EntitySubscriberMetadataArgs";

/**
 * Contains metadata information about ORM event subscribers.
 */
export class EntitySubscriberMetadata extends TargetMetadata {

    constructor(args: EntitySubscriberMetadataArgs) {
        super(args.target);
    }
    
}