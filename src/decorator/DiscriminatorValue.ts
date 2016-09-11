import {getMetadataArgsStorage} from "../index";
import {DiscriminatorValueMetadataArgs} from "../metadata-args/DiscriminatorValueMetadataArgs";

/**
 */
export function DiscriminatorValue(value: any): Function {
    return function (target: Function) {
        const args: DiscriminatorValueMetadataArgs = {
            target: target,
            value: value
        };
        getMetadataArgsStorage().discriminatorValues.add(args);
    };
}
