import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnTypes, ColumnType} from "../../metadata/types/ColumnTypes";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 */
export function DiscriminatorColumn(discriminatorOptions: { name: string, type: ColumnType }): Function {
    return function (object: Object, propertyName: string) {

        const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        const options: ColumnOptions = {
            name: discriminatorOptions.name,
            type: discriminatorOptions.type
        };

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            propertyType: reflectedType,
            mode: "discriminator",
            options: options
        };
        getMetadataArgsStorage().columns.add(args);
    };
}

