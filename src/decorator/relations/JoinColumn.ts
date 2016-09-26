import {getMetadataArgsStorage} from "../../index";
import {JoinColumnOptions} from "../options/JoinColumnOptions";
import {JoinColumnMetadataArgs} from "../../metadata-args/JoinColumnMetadataArgs";

/**
 * JoinColumn decorator used on one-to-one relations to specify owner side of relationship.
 * It also can be used on both one-to-one and many-to-one relations to specify custom column name
 * or custom referenced column.
 */
export function JoinColumn(options?: JoinColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinColumnOptions;
        const args: JoinColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            name: options.name,
            referencedColumnName: options.referencedColumnName
        };
        getMetadataArgsStorage().joinColumns.add(args);
    };
}

