import {getMetadataArgsStorage} from "../index";
import {InheritanceMetadataArgs} from "../metadata-args/InheritanceMetadataArgs";

/**
 */
export function TableInheritance(type: "single-table"|"class-table") {
    return function (target: Function) {
        const args: InheritanceMetadataArgs = {
            target: target,
            type: type
        };
        getMetadataArgsStorage().inheritances.add(args);
    };
}