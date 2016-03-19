import {TableMetadata} from "../../metadata-builder/metadata/TableMetadata";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

/**
 * Allows to use columns and relations data from the inherited metadata.
 */
export function AbstractTable() {
    return function (cls: Function) {
        defaultMetadataStorage.addTableMetadata(new TableMetadata(cls, name, true));
    };
}