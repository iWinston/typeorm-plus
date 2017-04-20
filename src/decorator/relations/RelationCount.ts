import {getMetadataArgsStorage} from "../../index";
import {RelationCountMetadataArgs} from "../../metadata-args/RelationCountMetadataArgs";
import {QueryBuilder} from "../../query-builder/QueryBuilder";

/**
 * Holds a number of children in the closure table of the column.
 */
export function RelationCount<T>(relation: string|((object: T) => any), alias?: string, queryBuilderFactory?: (qb: QueryBuilder<any>) => QueryBuilder<any>): Function {
    return function (object: Object, propertyName: string) {
        const args: RelationCountMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        };
        getMetadataArgsStorage().relationCounts.add(args);
    };
}

