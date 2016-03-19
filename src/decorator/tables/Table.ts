import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {TableMetadata} from "../../metadata-builder/metadata/TableMetadata";

/**
 * This decorator is used to mark classes that will be a tables. Database schema will be created for all classes
 * decorated with it, and Repository can be retrieved and used for it.
 */
export function Table(name: string) {
    return function (cls: Function) {
        defaultMetadataStorage.addTableMetadata(new TableMetadata(cls, name, false));
    };
}
