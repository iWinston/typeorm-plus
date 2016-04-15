import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {OrmEventSubscriberMetadata} from "../../metadata-builder/metadata/OrmEventSubscriberMetadata";

/**
 * Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
 * occurs. Those classes must implement OrmSubscriber interface.
 */
export function OrmEventSubscriber() {
    return function (target: Function) {
        defaultMetadataStorage.addOrmEventSubscriberMetadata(new OrmEventSubscriberMetadata(target));
    };
}