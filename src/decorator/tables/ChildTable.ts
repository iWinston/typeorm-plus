import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Special type of the table used in the single-table inherited tables.
 */
export function ChildTable() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "child"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}