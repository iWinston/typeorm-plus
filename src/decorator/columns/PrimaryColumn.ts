import {ColumnOptions} from "../../metadata/options/ColumnOptions";
import {ColumnType, ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnTypeUndefinedError} from "../error/ColumnTypeUndefinedError";
import {defaultMetadataStorage} from "../../typeorm";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {PrimaryColumnCannotBeNullableError} from "../error/PrimaryColumnCannotBeNullableError";
import "reflect-metadata";

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
 * decorator will be persisted to the database when entity be saved. Primary columns also creates a PRIMARY KEY for
 * this column in a db.
 */
export function PrimaryColumn(options?: ColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
 * decorator will be persisted to the database when entity be saved. Primary columns also creates a PRIMARY KEY for
 * this column in a db.
 */
export function PrimaryColumn(type?: ColumnType, options?: ColumnOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
 * decorator will be persisted to the database when entity be saved. Primary columns also creates a PRIMARY KEY for
 * this column in a db.
 */
export function PrimaryColumn(typeOrOptions?: ColumnType|ColumnOptions, options?: ColumnOptions): Function {
    let type: ColumnType;
    if (typeof typeOrOptions === "string") {
        type = <ColumnType> typeOrOptions;
    } else {
        options = <ColumnOptions> typeOrOptions;
    }
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString(Reflect.getMetadata("design:type", object, propertyName));

        // if type is not given implicitly then try to guess it
        if (!type)
            type = ColumnTypes.determineTypeFromFunction(Reflect.getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // check if there is no type in column options then set type from first function argument, or guessed one
        if (!options.type)
            options.type = type;

        // if we still don't have a type then we need to give error to user that type is required
        if (!options.type)
            throw new ColumnTypeUndefinedError(object, propertyName);

        // check if column is not nullable, because we cannot allow a primary key to be nullable
        if (options.nullable)
            throw new PrimaryColumnCannotBeNullableError(object, propertyName);

        // create and register a new column metadata
        defaultMetadataStorage().addColumnMetadata(new ColumnMetadata({
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            isPrimaryKey: true,
            options: options
        }));
    };
}

