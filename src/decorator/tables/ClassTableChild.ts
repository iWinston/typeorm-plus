import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {EntityOptions} from "../options/EntityOptions";

/**
 * Special type of the table used in the class-table inherited tables.
 *
 * @deprecated Use @ClassEntityChild decorator instead.
 */
export function ClassTableChild(tableName?: string, options?: EntityOptions) {
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