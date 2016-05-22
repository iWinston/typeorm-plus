import {defaultMetadataStorage} from "../../index";
import {EventListenerTypes} from "../../metadata/types/EventListenerTypes";
import {EntityListenerMetadata} from "../../metadata/EntityListenerMetadata";

/**
 * Calls a method on which this decorator is applied after this entity insertion.
 */
export function AfterInsert() {
    return function (object: Object, propertyName: string) {
        defaultMetadataStorage().entityListenerMetadatas.add(new EntityListenerMetadata(
            object.constructor, 
            propertyName, 
            EventListenerTypes.AFTER_INSERT
        ));
    };
}