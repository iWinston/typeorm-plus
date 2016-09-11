import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnType} from "../../metadata/types/ColumnTypes";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 */
export function DiscriminatorColumn(discriminatorOptions: { name: string, type: ColumnType }): Function {
    return function (target: Function) {

        // if column options are not given then create a new empty options
        const options: ColumnOptions = {
            name: discriminatorOptions.name,
            type: discriminatorOptions.type
        };

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: target,
            mode: "discriminator",
            options: options
        };
        getMetadataArgsStorage().columns.add(args);
    };
}

