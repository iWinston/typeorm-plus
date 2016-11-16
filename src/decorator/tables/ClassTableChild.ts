import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {TableOptions} from "../options/TableOptions";

/**
 * Special type of the table used in the class-table inherited tables.
 */
export function ClassTableChild(tableName?: string, options?: TableOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: tableName,
            type: "class-table-child",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            skipSchemaSync: !!(options && options.skipSchemaSync === true)
        };
        getMetadataArgsStorage().tables.add(args);
    };
}