import {ColumnOptions} from "../../metadata/options/ColumnOptions";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {defaultMetadataStorage} from "../../typeorm";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * This column will store a number - version of the entity. Every time your entity will be persisted, this number will
 * be increased by one - so you can organize visioning and update strategies of your entity.
 */
export function VersionColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString((<any> Reflect).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // implicitly set a type, because this column's type cannot be anything else except date
        options.type = ColumnTypes.INTEGER;

        // todo: check if reflectedType is number too

        // create and register a new column metadata
        defaultMetadataStorage().columnMetadatas.add(new ColumnMetadata({
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            mode: "version",
            options: options
        }));
    };
}

