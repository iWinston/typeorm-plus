import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {OrmEventSubscriberMetadata} from "../metadata-builder/metadata/OrmEventSubscriberMetadata";

/**
 * Subscribers that gonna listen to ORM events must be decorated with this decorator.
 */
export function OrmEventSubscriber() {
    return function (target: Function) {
        defaultMetadataStorage.addOrmEventSubscriberMetadata(new OrmEventSubscriberMetadata(target));
    };
}