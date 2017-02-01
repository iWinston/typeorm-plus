import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {EntityOptions} from "../options/EntityOptions";

/**
 * Used on a tables that stores its children in a tree using closure deisgn pattern.
 *
 * @deprecated Use @ClosureEntity decorator instead.
 */
export function ClosureTable(name?: string, options?: EntityOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "closure",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            skipSchemaSync: !!(options && options.skipSchemaSync === true)
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
