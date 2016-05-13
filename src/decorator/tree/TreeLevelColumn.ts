import {defaultMetadataStorage} from "../../typeorm";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnOptions} from "../../metadata/options/ColumnOptions";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * Creates a "level"/"length" column to the table that holds a closure table.
 */
export function TreeLevelColumn(): Function {
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString((<any> Reflect).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        const options: ColumnOptions = {};

        // implicitly set a type, because this column's type cannot be anything else except number
        options.type = ColumnTypes.INTEGER;

        // create and register a new column metadata
        defaultMetadataStorage().columnMetadatas.add(new ColumnMetadata({
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            mode: "treeLevel",
            options: options
        }));
    };
}

