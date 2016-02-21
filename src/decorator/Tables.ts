import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {TableMetadata} from "../metadata-builder/metadata/TableMetadata";

/**
 * This decorator is used to mark classes that they gonna be Tables.
 */
export function Table(name: string) {
    return function (cls: Function) {
        const metadata = new TableMetadata(cls, name, false);
        defaultMetadataStorage.addTableMetadata(metadata);
    };
}

/**
 * Classes marked within this decorator can provide fields that can be used in a real tables
 * (they will be inherited).
 */
export function AbstractTable() {
    return function (cls: Function) {
        const metadata = new TableMetadata(cls, name, true);
        defaultMetadataStorage.addTableMetadata(metadata);
    };
}