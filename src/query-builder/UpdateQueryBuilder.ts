import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class UpdateQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "simple", condition: where });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "and", condition: where });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "or", condition: where });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder this way: new UpdateQueryBuilder(queryBuilder) where queryBuilder
     * is cloned QueryBuilder.
     */
    clone(): UpdateQueryBuilder<Entity> {
        const qb = new UpdateQueryBuilder<Entity>(this.connection);
        qb.expressionMap = this.expressionMap.clone();
        return qb;
    }

}
