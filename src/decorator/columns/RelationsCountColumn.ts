import {getMetadataArgsStorage} from "../../index";
import {RelationsCountMetadataArgs} from "../../metadata/args/RelationsCountMetadataArgs";

/**
 * Holds a number of children in the closure table of the column.
 */
export function RelationsCountColumn<T>(relation: string|((object: T) => any)): Function {
    return function (object: Object, propertyName: string) {

        // todo: need to check if property type is number?
        // const reflectedType = ColumnTypes.typeToString((<any> Reflect).getMetadata("design:type", object, propertyName));

        // create and register a new column metadata
        const metadata: RelationsCountMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation
        };
        getMetadataArgsStorage().relationCountMetadatas.add(metadata);
    };
}

