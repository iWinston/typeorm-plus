import {getMetadataArgsStorage} from "../../index";
import {JoinColumnOptions} from "../../metadata/options/JoinColumnOptions";
import {JoinColumnMetadataArgs} from "../../metadata/args/JoinColumnMetadataArgs";

/**
 */
export function JoinColumn(options?: JoinColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinColumnOptions;
        const args: JoinColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            options: options
        };
        getMetadataArgsStorage().joinColumns.add(args);
    };
}

