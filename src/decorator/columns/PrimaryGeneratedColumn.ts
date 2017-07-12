import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {PrimaryGeneratedColumnNumericOptions} from "../options/PrimaryGeneratedColumnNumericOptions";
import {ColumnOptions} from "../options/ColumnOptions";
import {PrimaryGeneratedColumnUUIDOptions} from "../options/PrimaryGeneratedColumnUUIDOptions";

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnNumericOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(strategy: "increment", options?: PrimaryGeneratedColumnNumericOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export function PrimaryGeneratedColumn(strategy: "uuid", options?: PrimaryGeneratedColumnUUIDOptions): Function;

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * This column creates an integer PRIMARY COLUMN with generated set to true.
 * This column creates is an alias for @PrimaryColumn("int", { generated: true }).
 */
export function PrimaryGeneratedColumn(strategyOrOptions?: "increment"|"uuid"|PrimaryGeneratedColumnNumericOptions|PrimaryGeneratedColumnUUIDOptions,
                                       maybeOptions?: PrimaryGeneratedColumnNumericOptions|PrimaryGeneratedColumnUUIDOptions): Function {
    const options: ColumnOptions = {};

    if (strategyOrOptions) {
        if (typeof strategyOrOptions === "string")
            options.generationStrategy = strategyOrOptions as "increment"|"uuid";

        if (strategyOrOptions instanceof Object)
            Object.assign(options, strategyOrOptions);
    } else {
        options.generationStrategy = "increment";
    }

    if (maybeOptions instanceof Object)
        Object.assign(options, maybeOptions);

    return function (object: Object, propertyName: string) {

        // check if there is no type in column options then set the int type - by default for auto generated column
        if (!options.type) {
            if (options.generationStrategy === "increment") {
                Object.assign(options, { type: Number}  as ColumnOptions);
            } else {
                Object.assign(options, { type: "uuid"}  as ColumnOptions);
            }
        }

        // implicitly set a primary and generated to column options
        Object.assign(options, { primary: true, generated: true } as ColumnOptions);

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

