import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Abstract table is a table that contains columns and relations for all tables that will inherit this table.
 * Database table for the abstract table is not created.
 *
 * @deprecated Use @AbstractEntity decorator instead.
 */
export function AbstractTable() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "abstract"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}