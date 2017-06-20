import {QueryBuilder} from "./QueryBuilder";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class InsertQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder this way: new InsertQueryBuilder(queryBuilder) where queryBuilder
     * is cloned QueryBuilder.
     */
    clone(): InsertQueryBuilder<Entity> {
        const qb = new InsertQueryBuilder<Entity>(this.connection);
        qb.expressionMap = this.expressionMap.clone();
        return qb;
    }

}
