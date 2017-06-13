import {ColumnOptions} from "../options/ColumnOptions";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * This column will store an update date of the updated object.
 * This date is being updated each time you persist the object.
 */
export function UpdateDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        // const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // implicitly set a type, because this column's type cannot be anything else except date
        // options = Object.assign({ type: Date } as ColumnOptions, options);

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            mode: "updateDate",
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

