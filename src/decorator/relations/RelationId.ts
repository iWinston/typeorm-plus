import {getMetadataArgsStorage} from "../../index";
import {RelationIdMetadataArgs} from "../../metadata-args/RelationIdMetadataArgs";

/**
 * Special decorator used to extract relation id into separate entity property.
 */
export function RelationId<T>(relation: string|((object: T) => any)): Function {
    return function (object: Object, propertyName: string) {
        const args: RelationIdMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation
        };
        getMetadataArgsStorage().relationIds.add(args);
    };
}

