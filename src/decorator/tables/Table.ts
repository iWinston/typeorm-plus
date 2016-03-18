import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {TableMetadata} from "../../metadata-builder/metadata/TableMetadata";

/**
 * This decorator is used to mark classes that they gonna be Tables.
 */
export function Table(name: string) {
    return function (cls: Function) {
        defaultMetadataStorage.addTableMetadata(new TableMetadata(cls, name, false));
    };
}
