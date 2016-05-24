import {getMetadataArgsStorage} from "../../index";
import {EventListenerTypes} from "../../metadata/types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../../metadata/args/EntityListenerMetadataArgs";

/**
 * Calls a method on which this decorator is applied before this entity update.
 */
export function BeforeUpdate() {
    return function (object: Object, propertyName: string) {
        const metadata: EntityListenerMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes.BEFORE_UPDATE
        };
        getMetadataArgsStorage().entityListenerMetadatas.add(metadata);
    };
}