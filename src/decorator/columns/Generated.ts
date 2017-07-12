import {getMetadataArgsStorage} from "../../index";
import {GeneratedMetadataArgs} from "../../metadata-args/GeneratedMetadataArgs";

/**
 * Generated decorator is used to mark a specific class property as a generated table column.
 */
export function Generated(strategy: "increment"|"uuid" = "increment"): Function {
    return function (object: Object, propertyName: string) {
        const args: GeneratedMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            strategy: strategy
        };
        getMetadataArgsStorage().generations.push(args);
    };
}

