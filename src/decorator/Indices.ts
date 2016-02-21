import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {IndexMetadata} from "../metadata-builder/metadata/IndexMetadata";
import {CompoundIndexMetadata} from "../metadata-builder/metadata/CompoundIndexMetadata";

/**
 * Fields that needs to be indexed must be marked with this annotation.
 */
export function Index() {
    return function (object: Object, propertyName: string) {
        const metadata = new IndexMetadata(object.constructor, propertyName);
        defaultMetadataStorage.addIndexMetadata(metadata);
    };
}

/**
 * Compound indexes must be set on document classes and must specify fields to be indexed.
 */
export function CompoundIndex(fields: string[]) {
    return function (cls: Function) {
        const metadata = new CompoundIndexMetadata(cls, fields);
        defaultMetadataStorage.addCompoundIndexMetadata(metadata);
    };
}