import {TableMetadata} from "../../metadata-builder/metadata/TableMetadata";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";

/**
 * Classes marked within this decorator can provide fields that can be used in a real tables
 * (they will be inherited).
 */
export function AbstractTable() {
    return function (cls: Function) {
        defaultMetadataStorage.addTableMetadata(new TableMetadata(cls, name, true));
    };
}