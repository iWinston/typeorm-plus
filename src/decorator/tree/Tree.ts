import {getMetadataArgsStorage} from "../../index";
import {TreeMetadataArgs} from "../../metadata-args/TreeMetadataArgs";
import {TreeType} from "../../metadata/types/TreeTypes";

/**
 * Marks entity to work like a tree.
 */
export function Tree(type: TreeType): Function {
    return function (target: Function) {
        const args: TreeMetadataArgs = {
            target: target,
            type: type
        };
        getMetadataArgsStorage().trees.push(args);
    };
}
