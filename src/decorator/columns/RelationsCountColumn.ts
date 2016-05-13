import {defaultMetadataStorage} from "../../typeorm";
import {RelationsCountMetadata} from "../../metadata/RelationsCountMetadata";

/**
 * Holds a number of children in the closure table of the column.
 */
export function RelationsCountColumn<T>(relation: string|((object: T) => any)): Function {
    return function (object: Object, propertyName: string) {

        // todo: need to check if property type is number?
        // const reflectedType = ColumnTypes.typeToString((<any> Reflect).getMetadata("design:type", object, propertyName));

        // create and register a new column metadata
        defaultMetadataStorage().relationCountMetadatas.add(new RelationsCountMetadata(object.constructor, propertyName, relation));
    };
}

