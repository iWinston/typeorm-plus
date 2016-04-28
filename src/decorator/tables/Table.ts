import {defaultMetadataStorage} from "../../typeorm";
import {TableMetadata} from "../../metadata/TableMetadata";

/**
 * This decorator is used to mark classes that will be a tables. Database schema will be created for all classes
 * decorated with it, and Repository can be retrieved and used for it.
 */
export function Table(name?: string) {
    return function (cls: Function) {
        defaultMetadataStorage().tableMetadatas.add(new TableMetadata(cls, name));
    };
}
