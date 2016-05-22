import {ColumnOptions} from "../../metadata/options/ColumnOptions";
import {ColumnType, ColumnTypes} from "../../metadata/types/ColumnTypes";
import {defaultMetadataStorage} from "../../index";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * This column will store a creation date of the inserted object. Creation date is generated and inserted only once,
 * at the first time when you create an object, the value is inserted into the table, and is never touched again.
 */
export function CreateDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString((<any> Reflect).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // implicitly set a type, because this column's type cannot be anything else except date
        options.type = ColumnTypes.DATETIME;

        // create and register a new column metadata
        defaultMetadataStorage().columnMetadatas.add(new ColumnMetadata({
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            mode: "createDate",
            options: options
        }));
    };
}

