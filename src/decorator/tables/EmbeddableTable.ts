import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * This decorators is used on the entities that must be embedded into the tables.
 *
 * @deprecated Use @EmbeddableEntity decorator instead.
 */
export function EmbeddableTable(): Function {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            type: "embeddable",
            orderBy: undefined
        };
        getMetadataArgsStorage().tables.add(args);
    };
}
