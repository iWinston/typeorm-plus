import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata/args/TableMetadataArgs";

/**
 * This decorator is used to mark classes that will be a tables. Database schema will be created for all classes
 * decorated with it, and Repository can be retrieved and used for it.
 */
export function ClosureTable(name?: string) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "closure"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
