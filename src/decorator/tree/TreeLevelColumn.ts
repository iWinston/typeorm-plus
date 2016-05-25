import {getMetadataArgsStorage} from "../../index";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnOptions} from "../../metadata/options/ColumnOptions";
import {ColumnMetadataArgs} from "../../metadata/args/ColumnMetadataArgs";

/**
 * Creates a "level"/"length" column to the table that holds a closure table.
 */
export function TreeLevelColumn(): Function {
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        const options: ColumnOptions = {};

        // implicitly set a type, because this column's type cannot be anything else except number
        options.type = ColumnTypes.INTEGER;

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            mode: "treeLevel",
            options: options
        };
        getMetadataArgsStorage().columns.add(args);
    };
}

