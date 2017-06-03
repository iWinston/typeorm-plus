import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * This column will store a number - version of the entity.
 * Every time your entity will be persisted, this number will be increased by one -
 * so you can organize visioning and update strategies of your entity.
 */
export function VersionColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        // const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // implicitly set a type, because this column's type cannot be anything else except date
        options = Object.assign({ type: ColumnTypes.INTEGER } as ColumnOptions, options);

        // todo: check if reflectedType is number too

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            mode: "version",
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

