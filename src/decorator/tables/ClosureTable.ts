import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {TableOptions} from "../options/TableOptions";

/**
 * This decorator is used to mark classes that will be a tables. Database schema will be created for all classes
 * decorated with it, and Repository can be retrieved and used for it.
 */
export function ClosureTable(name?: string, options?: TableOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "closure",
            orderBy: options && options.orderBy ? options.orderBy : undefined
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
