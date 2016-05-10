import {TableMetadata} from "../../metadata/TableMetadata";
import {defaultMetadataStorage} from "../../typeorm";

/**
 * Allows to use columns and relations data from the inherited metadata.
 */
export function AbstractTable() {
    return function (cls: Function) {
        defaultMetadataStorage().tableMetadatas.add(new TableMetadata(cls, undefined, "abstract"));
    };
}