import {TargetMetadataArgs} from "./TargetMetadataArgs";

/**
 */
export interface EventSubscriberMetadataArgs extends TargetMetadataArgs {

    /**
     * Class to which this subscriber is applied.
     */
    target: Function;
    
}
