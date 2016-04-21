import {ColumnOptions} from "../../metadata-builder/options/ColumnOptions";
import {ColumnType, ColumnTypes} from "../../metadata-builder/types/ColumnTypes";
import {defaultMetadataStorage} from "../../metadata-builder/MetadataStorage";
import {ColumnMetadata} from "../../metadata-builder/metadata/ColumnMetadata";
import "reflect-metadata";

/**
 * This column will store an update date of the updated object. This date is being updated each time you persist the
 * object.
 */
export function UpdateDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString(Reflect.getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options)
            options = {};

        // implicitly set a type, because this column's type cannot be anything else except date
        options.type = <ColumnType> ColumnTypes.DATETIME;

        // create and register a new column metadata
        defaultMetadataStorage.addColumnMetadata(new ColumnMetadata({
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            isUpdateDate: true,
            options: options
        }));
    };
}

