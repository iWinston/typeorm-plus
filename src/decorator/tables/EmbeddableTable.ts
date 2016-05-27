import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * This decorators is used on the entities that must be embedded into the tables.
 */
export function EmbeddableTable(): Function {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "embeddable"
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
