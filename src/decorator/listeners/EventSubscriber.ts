import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {EventSubscriberMetadata} from "../../metadata-builder/metadata/EventSubscriberMetadata";

/**
 * Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
 * occurs. Those classes must implement EventSubscriberInterface interface.
 */
export function EventSubscriber() {
    return function (target: Function) {
        defaultMetadataStorage.addEventSubscriberMetadata(new EventSubscriberMetadata(target));
    };
}