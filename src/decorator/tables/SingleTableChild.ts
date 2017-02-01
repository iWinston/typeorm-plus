import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Special type of the table used in the single-table inherited tables.
 *
 * @deprecated Use @SingleEntityChild decorator instead.
 */
export function SingleTableChild() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "single-table-child",
            orderBy: undefined
        };
        getMetadataArgsStorage().tables.add(args);
    };
}