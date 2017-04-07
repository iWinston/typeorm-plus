import {getMetadataArgsStorage} from "../../index";
import {RelationIdMetadataArgs} from "../../metadata-args/RelationIdMetadataArgs";
import {QueryBuilder} from "../../query-builder/QueryBuilder";

/**
 * Special decorator used to extract relation id into separate entity property.
 */
export function RelationId<T>(relation: string|((object: T) => any), alias?: string, queryBuilderFactory?: (qb: QueryBuilder<any>) => QueryBuilder<any>): Function {
    return function (object: Object, propertyName: string) {
        const args: RelationIdMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        };
        getMetadataArgsStorage().relationIds.add(args);
    };
}

