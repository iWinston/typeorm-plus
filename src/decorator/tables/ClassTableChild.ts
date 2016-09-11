import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Special type of the table used in the class-table inherited tables.
 */
export function ClassTableChild() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "class-table-child"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}