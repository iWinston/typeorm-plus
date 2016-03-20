import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {IndexMetadata} from "../../metadata-builder/metadata/IndexMetadata";

/**
 * Fields that needs to be indexed must be marked with this decorator.
 */
export function Index(name?: string) {
    return function (object: Object, propertyName: string) {
        defaultMetadataStorage.addIndexMetadata(new IndexMetadata(object.constructor, propertyName, name));
    };
}
