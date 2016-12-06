import {OrderByCondition} from "./OrderByCondition";
import {ObjectLiteral} from "../common/ObjectLiteral";

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
 *     orderBy: {
 *         "photo.id": "DESC"
 *     },
 *     groupBy: [
 *         "photo.name"
 *     ],
 *     leftJoin: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     innerJoin: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     leftJoinAndSelect: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     },
 *     innerJoinAndSelect: {
 *         author: "photo.author",
 *         categories: "categories",
 *         user: "categories.user",
 *         profile: "user.profile"
 *     }
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
    whereConditions?: ObjectLiteral;

    /**
     * HAVING conditions. Key-value object pair, where each key is a column name and value is a column value.
     * "AND" is applied between all parameters.
     */
    havingConditions?: ObjectLiteral;

    /**
     * Array of ORDER BY expressions.
     */
    orderBy?: OrderByCondition;

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

    /**
     * Indicates if query builder should add virtual columns to the entity too.
     */
    enabledOptions?: ("RELATION_ID_VALUES")[];

}
