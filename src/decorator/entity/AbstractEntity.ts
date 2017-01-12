import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Abstract entity is a class that contains columns and relations for all entities that will inherit this entity.
 * Database table for the abstract entity is not created.
 */
export function AbstractEntity() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "abstract"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}