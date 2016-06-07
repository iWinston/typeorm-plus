import {Broadcaster} from "./Broadcaster";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";

/**
 * Creates connection's Broadcaster used to broadcast entity events for the given connection.
 */
export class BroadcasterFactory {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    createBroadcaster(entityMetadatas: EntityMetadataCollection,
                      subscriberMetadatas: EntitySubscriberInterface<any>[],
                      entityListeners: EntityListenerMetadata[]) {
        return new Broadcaster(entityMetadatas, subscriberMetadatas, entityListeners);
    }

}