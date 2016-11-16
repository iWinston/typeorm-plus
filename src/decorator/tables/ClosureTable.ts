import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {TableOptions} from "../options/TableOptions";

/**
 * Used on a tables that stores its children in a tree using closure deisgn pattern.
 */
export function ClosureTable(name?: string, options?: TableOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "closure",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            skipSchemaSync: (options && options.skipSchemaSync === true) || false
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
