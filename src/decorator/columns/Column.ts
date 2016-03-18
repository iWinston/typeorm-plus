import "reflect-metadata";
import {ColumnOptions, ColumnTypeString, ColumnTypes} from "../../metadata-builder/options/ColumnOptions";
import {ColumnTypeUndefinedError} from "../error/ColumnTypeUndefinedError";
import {AutoIncrementOnlyForPrimaryError} from "../error/AutoIncrementOnlyForPrimaryError";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {ColumnMetadata} from "../../metadata-builder/metadata/ColumnMetadata";

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this 
 * decorator will be persisted to the database when entity be saved.
 */
export function Column(options?: ColumnOptions): Function;
export function Column(type?: ColumnTypeString, options?: ColumnOptions): Function;
export function Column(typeOrOptions?: ColumnTypeString|ColumnOptions, options?: ColumnOptions): Function {
    let type: ColumnTypeString;
    if (typeof typeOrOptions === "string") {
        type = <ColumnTypeString> typeOrOptions;
    } else {
        options = <ColumnOptions> typeOrOptions;
    }
    return function (object: Object, propertyName: string) {

        // if type is not given implicitly then try to guess it
        if (!type)
            type = ColumnTypes.determineTypeFromFunction(Reflect.getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options)
            options = {};

        // check if there is no type in column options then set type from first function argument, or guessed one
        if (!options.type)
            options.type = type;

        // if we still don't have a type then we need to give error to user that type is required
        if (!options.type)
            throw new ColumnTypeUndefinedError(object, propertyName);

        // check if auto increment is not set for simple column
        if (options.autoIncrement)
            throw new AutoIncrementOnlyForPrimaryError(object, propertyName);

        // create and register a new column metadata
        defaultMetadataStorage.addColumnMetadata(new ColumnMetadata({
            target: object.constructor,
            propertyName: propertyName,
            options: options
        }));
    };
}
