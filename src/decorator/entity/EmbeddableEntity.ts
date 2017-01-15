import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * This decorator is used on the entities that must be embedded into another entities.
 */
export function EmbeddableEntity(): Function {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            type: "embeddable",
            orderBy: undefined
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
