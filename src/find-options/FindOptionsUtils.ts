import {FindOptions} from "./FindOptions";
import {QueryBuilder} from "../query-builder/QueryBuilder";

/**
 * Utilities to work with FindOptions.
 */
export class FindOptionsUtils {

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static isFindOptions(object: any): object is FindOptions {
        const possibleOptions: FindOptions = object;
        return  possibleOptions && !!possibleOptions.alias && typeof possibleOptions.alias === "string" && (
                    !!possibleOptions.limit ||
                    !!possibleOptions.offset ||
                    !!possibleOptions.firstResult ||
                    !!possibleOptions.maxResults ||
                    !!possibleOptions.where ||
                    !!possibleOptions.having ||
                    !!possibleOptions.whereConditions ||
                    !!possibleOptions.havingConditions ||
                    !!possibleOptions.orderBy ||
                    !!possibleOptions.groupBy ||
                    !!possibleOptions.leftJoinAndSelect ||
                    !!possibleOptions.innerJoinAndSelect ||
                    !!possibleOptions.leftJoin ||
                    !!possibleOptions.innerJoin ||
                    !!possibleOptions.parameters ||
                    !!possibleOptions.enabledOptions
                );
    }

    /**
     * Applies give find options to the given query builder.
     */
    static applyOptionsToQueryBuilder(qb: QueryBuilder<any>, options: FindOptions): QueryBuilder<any> {

        if (options.limit)
            qb.setLimit(options.limit);
        if (options.offset)
            qb.setOffset(options.offset);
        if (options.firstResult)
            qb.setFirstResult(options.firstResult);
        if (options.maxResults)
            qb.setMaxResults(options.maxResults);
        if (options.where)
            qb.where(options.where);
        if (options.having)
            qb.having(options.having);

        if (options.whereConditions) {
            Object.keys(options.whereConditions).forEach((key, index) => {
                const name = key.indexOf(".") === -1 ? options.alias + "." + key : key;
                if (options.whereConditions![key] === null) {
                    qb.andWhere(name + " IS NULL");

                } else {
                    const parameterName = "whereConditions_" + index;
                    qb.andWhere(name + "=:" + parameterName, { [parameterName]: options.whereConditions![key] });
                }
            });
        }

        if (options.havingConditions) {
            Object.keys(options.havingConditions).forEach((key, index) => {
                const name = key.indexOf(".") === -1 ? options.alias + "." + key : key;
                if (options.havingConditions![key] === null) {
                    qb.andHaving(name + " IS NULL");

                } else {
                    const parameterName = "havingConditions_" + index;
                    qb.andHaving(name + "=:" + parameterName, { [parameterName]: options.whereConditions![key] });
                }
            });
        }

        if (options.orderBy)
            Object.keys(options.orderBy).forEach(columnName => qb.addOrderBy(columnName, options.orderBy![columnName]));

        if (options.groupBy)
            options.groupBy.forEach(groupBy => qb.addGroupBy(groupBy));

        if (options.leftJoin)
            Object.keys(options.leftJoin).forEach(key => {
                if (options.leftJoin) // this check because of tsc bug
                    qb.leftJoin(options.leftJoin[key], key);
            });

        if (options.innerJoin)
            Object.keys(options.innerJoin).forEach(key => {
                if (options.innerJoin) // this check because of tsc bug
                    qb.innerJoin(options.innerJoin[key], key);
            });

        if (options.leftJoinAndSelect)
            Object.keys(options.leftJoinAndSelect).forEach(key => {
                if (options.leftJoinAndSelect) // this check because of tsc bug
                    qb.leftJoinAndSelect(options.leftJoinAndSelect[key], key);
            });

        if (options.innerJoinAndSelect)
            Object.keys(options.innerJoinAndSelect).forEach(key => {
                if (options.innerJoinAndSelect) // this check because of tsc bug
                    qb.innerJoinAndSelect(options.innerJoinAndSelect[key], key);
            });

        if (options.parameters)
            qb.setParameters(options.parameters);

        if (options.enabledOptions) {
            options.enabledOptions.forEach(option => {
                qb.enableOption(option);
            });
        }

        return qb;
    }

}