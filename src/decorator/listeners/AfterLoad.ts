import {defaultMetadataStorage} from "../../typeorm";
import {EventListenerTypes} from "../../metadata/types/EventListenerTypes";
import {EntityListenerMetadata} from "../../metadata/EntityListenerMetadata";

/**
 * Calls a method on which this decorator is applied after entity is loaded.
 */
export function AfterLoad() {
    return function (object: Object, propertyName: string) {
        defaultMetadataStorage().entityListenerMetadatas.add(new EntityListenerMetadata(
            object.constructor, 
            propertyName, 
            EventListenerTypes.AFTER_LOAD
        ));
    };
}