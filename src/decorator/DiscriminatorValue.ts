import {getMetadataArgsStorage} from "../index";
import {DiscriminatorNameMetadataArgs} from "../metadata-args/DiscriminatorNameMetadataArgs";

/**
 */
export function DiscriminatorName(name: string): Function {
    return function (target: Function) {
        const args: DiscriminatorNameMetadataArgs = {
            target: target,
            name: name
        };
        getMetadataArgsStorage().discriminatorNames.add(args);
    };
}
