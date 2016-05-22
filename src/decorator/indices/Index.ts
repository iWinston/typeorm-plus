import {defaultMetadataStorage} from "../../index";
import {IndexMetadata} from "../../metadata/IndexMetadata";

/**
 * Fields that needs to be indexed must be marked with this decorator.
 */
export function Index(name?: string) {
    return function (object: Object, propertyName: string) {
        defaultMetadataStorage().indexMetadatas.add(new IndexMetadata(object.constructor, propertyName, name));
    };
}
