import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnTypeUndefinedError} from "../error/ColumnTypeUndefinedError";
import {GeneratedOnlyForPrimaryError} from "../error/GeneratedOnlyForPrimaryError";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {ObjectType} from "../../common/ObjectType";

/**
 * Column decorator is used to mark a specific class property as a table column.
 * This decorator creates a special type of a column - array of values that are stored special way in a column.
 */
export function ArrayColumn<T>(type?: "string"|"number"|"boolean"|((type?: any) => ObjectType<T>), options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // todo: column type depend of driver. for relational databases it always will be string
        // for mongo it will be given "type"
        if (!options.type)
            options = Object.assign({ type: type } as ColumnOptions, options);

        // todo: this is incomplete

        // if we still don't have a type then we need to give error to user that type is required
        if (!options.type)
            throw new ColumnTypeUndefinedError(object, propertyName);

        // check if auto increment is not set for simple column
        if (options.generated)
            throw new GeneratedOnlyForPrimaryError(object, propertyName);

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular", // todo: array
            options: options
        };
        getMetadataArgsStorage().columns.add(args);
    };
}
