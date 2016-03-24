import {QueryBuilder} from "../query-builder/QueryBuilder";

/**
 * Options to be passed to find methods.
 * 
 * Example:
 *  const options: FindOptions = {
 *     alias: "photo",
 *     limit: 100,
 *     offset: 0,
 *     firstResult: 5,
 *     maxResults: 10,
 *     where: "photo.likesCount > 0 && photo.likesCount < 10",
 *     having: "photo.viewsCount > 0 && photo.viewsCount < 1000",
 *     whereConditions: {
 *         "photo.isPublished": true,
 *         "photo.name": "Me and Bears"
 *     },
 *     havingConditions: {
 *         "photo.filename": "bears.jpg"
 *     },
 *     orderBy: [
 *         { sort: "photo.id", order: "DESC" }
 *     ],
 *     groupBy: [
 *         "photo.name"
 *     ],
 *     leftJoin: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     innerJoin: [
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     ],
 *     leftJoinAndSelect: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     innerJoinAndSelect: [
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     ]
 * };
 */
export interface FindOptions {

    /**
     * Alias of the selected entity.
     */
    alias: string;

    /**
     * Selection limitation, e.g. LIMIT expression.
     */
    limit?: number;

    /**
     * From what position to select, e.g. OFFSET expression.
     */
    offset?: number;

    /**
     * First results to select (offset using pagination).
     */
    firstResult?: number;

    /**
     * Maximum result to select (limit using pagination).
     */
    maxResults?: number;

    /**
     * Regular WHERE expression.
     */
    where?: string;

    /**
     * Regular HAVING expression.
     */
    having?: string;

    /**
     * WHERE conditions. Key-value object pair, where each key is a column name and value is a column value. 
     * "AND" is applied between all parameters.
     */
    whereConditions?: Object;

    /**
     * HAVING conditions. Key-value object pair, where each key is a column name and value is a column value.
     * "AND" is applied between all parameters.
     */
    havingConditions?: Object;

    /**
     * Array of ORDER BY expressions.
     */
    orderBy?: { sort: string, order: "ASC"|"DESC" }[];

    /**
     * Array of column to GROUP BY.
     */
    groupBy?: string[];

    /**
     * Array of columns to LEFT JOIN.
     */
    leftJoinAndSelect?: { [key: string]: string };
    
    /**
     * Array of columns to INNER JOIN.
     */
    innerJoinAndSelect?: { [key: string]: string };

    /**
     * Array of columns to LEFT JOIN.
     */
    leftJoin?: { [key: string]: string };

    /**
     * Array of columns to INNER JOIN.
     */
    innerJoin?: { [key: string]: string };

    /**
     * Parameters used in the WHERE and HAVING expressions.
     */
    parameters?: Object;
    
}

/**
 * Utilities to work with FindOptions.
 */
export class FindOptionsUtils {

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static isFindOptions(object: any): object is FindOptions {
        const possibleOptions: FindOptions = object;
        return  possibleOptions.alias && typeof possibleOptions.alias === "string" && (
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
                    !!possibleOptions.parameters
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
            Object.keys(options.whereConditions).forEach(key => {
                const name = key.indexOf(".") === -1 ? options.alias + "." + key : key;
                qb.andWhere(name + "=:" + key);
            });
            qb.addParameters(options.whereConditions);
        }
        
        if (options.havingConditions) {
            Object.keys(options.havingConditions).forEach(key => {
                const name = key.indexOf(".") === -1 ? options.alias + "." + key : key;
                qb.andHaving(name + "=:" + key);
            });
            qb.addParameters(options.havingConditions);
        }
        
        if (options.orderBy)
            options.orderBy.forEach(orderBy => qb.addOrderBy(orderBy.sort, orderBy.order));
        
        if (options.groupBy)
            options.groupBy.forEach(groupBy => qb.addGroupBy(groupBy));
        
        if (options.leftJoin)
            Object.keys(options.leftJoin).forEach(key => qb.leftJoin(options.leftJoin[key], key));
        
        if (options.innerJoin)
            Object.keys(options.innerJoin).forEach(key => qb.innerJoin(options.innerJoin[key], key));
        
        if (options.leftJoinAndSelect)
            Object.keys(options.leftJoinAndSelect).forEach(key => qb.leftJoinAndSelect(options.leftJoinAndSelect[key], key));
        
        if (options.innerJoinAndSelect)
            Object.keys(options.innerJoinAndSelect).forEach(key => qb.innerJoinAndSelect(options.innerJoinAndSelect[key], key));

        if (options.parameters)
            qb.addParameters(options.parameters);
        
        return qb;
    }
    
}