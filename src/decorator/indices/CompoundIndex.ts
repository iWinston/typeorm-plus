import {CompoundIndexMetadata} from "../../metadata/CompoundIndexMetadata";
import {defaultMetadataStorage} from "../../typeorm";

/**
 * Compound indexes must be set on entity classes and must specify fields to be indexed.
 */
export function CompoundIndex(fields: string[]) {
    return function (cls: Function) {
        defaultMetadataStorage().addCompoundIndexMetadata(new CompoundIndexMetadata(cls, fields));
    };
}