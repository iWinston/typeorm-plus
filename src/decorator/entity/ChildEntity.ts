import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {DiscriminatorValueMetadataArgs} from "../../metadata-args/DiscriminatorValueMetadataArgs";

/**
 * Special type of the table used in the single-table inherited tables.
 */
export function ChildEntity(discriminatorValue?: any) {
    return function (target: Function) {

        const tableMetadataArgs: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "entity-child",
            orderBy: undefined
        };
        getMetadataArgsStorage().tables.push(tableMetadataArgs);

        if (discriminatorValue) {
            const discriminatorValueMetadataArgs: DiscriminatorValueMetadataArgs = {
                target: target,
                value: discriminatorValue
            };
            getMetadataArgsStorage().discriminatorValues.push(discriminatorValueMetadataArgs);
        }

    };
}