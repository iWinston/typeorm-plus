import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {EntityOptions} from "../options/EntityOptions";

/**
 * This decorator is used to mark classes that will be a tables. Database schema will be created for all classes
 * decorated with it, and Repository can be retrieved and used for it.
 *
 * @deprecated Use @Entity decorator instead.
 */
export function Table(name?: string, options?: EntityOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "regular",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            engine: options && options.engine ? options.engine : undefined,
            skipSchemaSync: !!(options && options.skipSchemaSync === true)
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
