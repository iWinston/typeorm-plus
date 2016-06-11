import {getMetadataArgsStorage} from "../../index";
import {RelationCountMetadataArgs} from "../../metadata-args/RelationCountMetadataArgs";

/**
 * Holds a number of children in the closure table of the column.
 */
export function RelationCount<T>(relation: string|((object: T) => any)): Function {
    return function (object: Object, propertyName: string) {

        // todo: need to check if property type is number?
        // const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // create and register a new column metadata
        const args: RelationCountMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation
        };
        getMetadataArgsStorage().relationCounts.add(args);
    };
}

