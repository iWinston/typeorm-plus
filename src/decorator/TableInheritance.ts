import {getMetadataArgsStorage} from "../index";
import {InheritanceMetadataArgs} from "../metadata-args/InheritanceMetadataArgs";

/**
 */
export function TableInheritance(type: "single-table"|"class-table") {
    return function (object: Object) {
        const args: InheritanceMetadataArgs = {
            target: object.constructor,
            type: type
        };
        getMetadataArgsStorage().inheritances.add(args);
    };
}