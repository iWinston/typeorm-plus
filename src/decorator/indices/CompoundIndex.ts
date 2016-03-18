import {CompoundIndexMetadata} from "../../metadata-builder/metadata/CompoundIndexMetadata";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

/**
 * Compound indexes must be set on entity classes and must specify fields to be indexed.
 */
export function CompoundIndex(fields: string[]) {
    return function (cls: Function) {
        defaultMetadataStorage.addCompoundIndexMetadata(new CompoundIndexMetadata(cls, fields));
    };
}