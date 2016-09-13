import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Special type of the table used in the single-table inherited tables.
 */
export function SingleTableChild() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "single-table-child"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}