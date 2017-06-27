import {RawSqlResultsToEntityTransformer} from "./transformer/RawSqlResultsToEntityTransformer";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {JoinOptions} from "./JoinOptions";
import {PessimisticLockTransactionRequiredError} from "./error/PessimisticLockTransactionRequiredError";
import {NoVersionOrUpdateDateColumnError} from "./error/NoVersionOrUpdateDateColumnError";
import {OptimisticLockVersionMismatchError} from "./error/OptimisticLockVersionMismatchError";
import {OptimisticLockCanNotBeUsedError} from "./error/OptimisticLockCanNotBeUsedError";
import {JoinAttribute} from "./JoinAttribute";
import {RelationIdAttribute} from "./relation-id/RelationIdAttribute";
import {RelationCountAttribute} from "./relation-count/RelationCountAttribute";
import {RelationIdLoader} from "./relation-id/RelationIdLoader";
import {RelationIdLoadResult} from "./relation-id/RelationIdLoadResult";
import {RelationIdMetadataToAttributeTransformer} from "./relation-id/RelationIdMetadataToAttributeTransformer";
import {RelationCountLoadResult} from "./relation-count/RelationCountLoadResult";
import {RelationCountLoader} from "./relation-count/RelationCountLoader";
import {RelationCountMetadataToAttributeTransformer} from "./relation-count/RelationCountMetadataToAttributeTransformer";
import {Broadcaster} from "../subscriber/Broadcaster";
import {QueryBuilder} from "./QueryBuilder";
import {ReadStream} from "fs";
import {LockNotSupportedOnGivenDriverError} from "./error/LockNotSupportedOnGivenDriverError";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {OracleDriver} from "../driver/oracle/OracleDriver";
import {SelectQuery} from "./SelectQuery";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {OrderByCondition} from "../find-options/OrderByCondition";
import {QueryExpressionMap} from "./QueryExpressionMap";
import {ObjectType} from "../common/ObjectType";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class SelectQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitOffsetExpression();
        sql += this.createLockExpression();
        sql = this.createLimitOffsetOracleSpecificExpression(sql);
        sql = sql.trim();
        if (this.expressionMap.subQuery)
            sql = "(" + sql + ")";
        return sql;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a subquery - query that can be used inside other queries.
     */
    subQuery(): SelectQueryBuilder<any> {
        const qb = this.createQueryBuilder();
        qb.expressionMap.subQuery = true;
        return qb;
    }

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string, selectionAliasName?: string): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string[]): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string|string[], selectionAliasName?: string): this {
        if (!selection)
            return this;

        if (selection instanceof Array) {
            this.expressionMap.selects = this.expressionMap.selects.concat(selection.map(selection => ({ selection: selection })));
        } else {
            this.expressionMap.selects.push({ selection: selection, aliasName: selectionAliasName });
        }

        return this;
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from<T>(entityTarget: ObjectType<T>|string, aliasName: string): SelectQueryBuilder<T> {
        this.setMainAlias(entityTarget, aliasName);
        return (this as any) as SelectQueryBuilder<T>;
    }

    /**
     * INNER JOINs (without selection) entity's property.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs (without selection) given entity's table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs (without selection) given table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.join("INNER", entityOrProperty, aliasName, condition, options);
        return this;
    }

    /**
     * LEFT JOINs (without selection) entity's property.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs (without selection) entity's table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs (without selection) given table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.join("LEFT", entityOrProperty, aliasName, condition, options);
        return this;
    }

    /**
     * INNER JOINs entity's property and adds all selection properties to SELECT.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs entity and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs table and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.addSelect(aliasName);
        this.innerJoin(entityOrProperty, aliasName, condition, options);
        return this;
    }

    /**
     * LEFT JOINs entity's property and adds all selection properties to SELECT.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs entity and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(entity: Function|string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs table and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.addSelect(aliasName);
        this.leftJoin(entityOrProperty, aliasName, condition, options);
        return this;
    }

    /**
     * INNER JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, entity: Function|string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * INNER JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, tableName: string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.addSelect(aliasName);
        this.join("INNER", entityOrProperty, aliasName, condition, options, mapToProperty, true);
        return this;
    }

    /**
     * INNER JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, entity: Function|string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * INNER JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, tableName: string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.addSelect(aliasName);
        this.join("INNER", entityOrProperty, aliasName, condition, options, mapToProperty, false);
        return this;
    }

    /**
     * LEFT JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, entity: Function|string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, tableName: string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.addSelect(aliasName);
        this.join("LEFT", entityOrProperty, aliasName, condition, options, mapToProperty, true);
        return this;
    }

    /**
     * LEFT JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, property: string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, entity: Function|string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, tableName: string, aliasName: string, condition: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string, aliasName: string, condition: string = "", options?: JoinOptions): this {
        this.addSelect(aliasName);
        this.join("LEFT", entityOrProperty, aliasName, condition, options, mapToProperty, false);
        return this;
    }

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string, relationName: string): this;

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string, relationName: string, options: { disableMixedMap: boolean }): this;

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string, relationName: string, aliasName: string, queryBuilderFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): this;

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string,
                         relationName: string,
                         aliasNameOrOptions?: string|{ disableMixedMap?: boolean },
                         queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): this {

        const relationIdAttribute = new RelationIdAttribute(this.expressionMap);
        relationIdAttribute.mapToProperty = mapToProperty;
        relationIdAttribute.relationName = relationName;
        if (typeof aliasNameOrOptions === "string")
            relationIdAttribute.alias = aliasNameOrOptions;
        if (aliasNameOrOptions instanceof Object && (aliasNameOrOptions as any).disableMixedMap)
            relationIdAttribute.disableMixedMap = true;

        relationIdAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationIdAttributes.push(relationIdAttribute);

        if (relationIdAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                name: relationIdAttribute.junctionAlias,
                metadata: relationIdAttribute.relation.junctionEntityMetadata
            });
        }
        return this;
    }

    /**
     * Counts number of entities of entity's relation and maps the value into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationCountAndMap(mapToProperty: string, relationName: string, aliasName?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): this {
        const relationCountAttribute = new RelationCountAttribute(this.expressionMap);
        relationCountAttribute.mapToProperty = mapToProperty;
        relationCountAttribute.relationName = relationName;
        relationCountAttribute.alias = aliasName;
        relationCountAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationCountAttributes.push(relationCountAttribute);

        this.expressionMap.createAlias({
            name: relationCountAttribute.junctionAlias
        });
        if (relationCountAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                name: relationCountAttribute.junctionAlias,
                metadata: relationCountAttribute.relation.junctionEntityMetadata
            });
        }
        return this;
    }

    /**
     * Loads all relation ids for all relations of the selected entity.
     * All relation ids will be mapped to relation property themself.
     */
    loadAllRelationIds(): this {
        this.expressionMap.mainAlias!.metadata.relations.forEach(relation => {
            this.loadRelationIdAndMap(
                this.expressionMap.mainAlias!.name + "." + relation.propertyPath,
                this.expressionMap.mainAlias!.name + "." + relation.propertyPath,
                { disableMixedMap: true }
            );
        });
        return this;
    }

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
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.andWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.andWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.orWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Sets HAVING condition in the query builder.
     * If you had previously HAVING expression defined,
     * calling this function will override previously set HAVING conditions.
     * Additionally you can add parameters used in where expression.
     */
    having(having: string, parameters?: ObjectLiteral): this {
        this.expressionMap.havings.push({ type: "simple", condition: having });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andHaving(having: string, parameters?: ObjectLiteral): this {
        this.expressionMap.havings.push({ type: "and", condition: having });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orHaving(having: string, parameters?: ObjectLiteral): this {
        this.expressionMap.havings.push({ type: "or", condition: having });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Sets GROUP BY condition in the query builder.
     * If you had previously GROUP BY expression defined,
     * calling this function will override previously set GROUP BY conditions.
     */
    groupBy(groupBy: string): this {
        this.expressionMap.groupBys = [groupBy];
        return this;
    }

    /**
     * Adds GROUP BY condition in the query builder.
     */
    addGroupBy(groupBy: string): this {
        this.expressionMap.groupBys.push(groupBy);
        return this;
    }

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     *
     * Calling order by without order set will remove all previously set order bys.
     */
    orderBy(): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(sort: string, order?: "ASC"|"DESC"): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(order: OrderByCondition): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(sort?: string|OrderByCondition, order: "ASC"|"DESC" = "ASC"): this {
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort as OrderByCondition;
            } else {
                this.expressionMap.orderBys = { [sort as string]: order };
            }
        } else {
            this.expressionMap.orderBys = {};
        }
        return this;
    }

    /**
     * Adds ORDER BY condition in the query builder.
     */
    addOrderBy(sort: string, order: "ASC"|"DESC" = "ASC"): this {
        this.expressionMap.orderBys[sort] = order;
        return this;
    }

    /**
     * Set's LIMIT - maximum number of rows to be selected.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead take method instead.
     */
    limit(limit?: number): this {
        this.expressionMap.limit = limit;
        return this;
    }

    /**
     * Set's OFFSET - selection offset.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead skip method instead.
     */
    offset(offset?: number): this {
        this.expressionMap.offset = offset;
        return this;
    }

    /**
     * Sets maximal number of entities to take.
     */
    take(take?: number): this {
        this.expressionMap.take = take;
        return this;
    }

    /**
     * Sets number of entities to skip.
     */
    skip(skip?: number): this {
        this.expressionMap.skip = skip;
        return this;
    }

    /**
     * Sets maximal number of entities to take.
     *
     * @deprecated use take method instead
     */
    setMaxResults(take?: number): this {
        this.expressionMap.take = take;
        return this;
    }

    /**
     * Sets number of entities to skip.
     *
     * @deprecated use skip method instead
     */
    setFirstResult(skip?: number): this {
        this.expressionMap.skip = skip;
        return this;
    }

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic", lockVersion: number): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic", lockVersion: Date): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "pessimistic_read"|"pessimistic_write"): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic"|"pessimistic_read"|"pessimistic_write", lockVersion?: number|Date): this {
        this.expressionMap.lockMode = lockMode;
        this.expressionMap.lockVersion = lockVersion;
        return this;

    }

    /**
     * Gets first raw result returned by execution of generated query builder sql.
     */
    async getRawOne(): Promise<any> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const results = await this.execute();
        return results[0];

    }

    /**
     * Gets all raw results returned by execution of generated query builder sql.
     */
    async getRawMany(): Promise<any[]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        return this.execute();
    }

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    async getRawAndEntities(): Promise<{ entities: Entity[], raw: any[] }> {
        return this.executeEntitiesAndRawResults({ release: true });
    }

    /**
     * Gets single entity returned by execution of generated query builder sql.
     */
    async getOne(): Promise<Entity|undefined> {
        const results = await this.getRawAndEntities();
        const result = results.entities[0] as any;

        if (result && this.expressionMap.lockMode === "optimistic" && this.expressionMap.lockVersion) {
            const metadata = this.expressionMap.mainAlias!.metadata;

            if (this.expressionMap.lockVersion instanceof Date) {
                const actualVersion = result[metadata.updateDateColumn!.propertyName]; // what if columns arent set?
                this.expressionMap.lockVersion.setMilliseconds(0);
                if (actualVersion.getTime() !== this.expressionMap.lockVersion.getTime())
                    throw new OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);

            } else {
                const actualVersion = result[metadata.versionColumn!.propertyName]; // what if columns arent set?
                if (actualVersion !== this.expressionMap.lockVersion)
                    throw new OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
            }
        }

        return result;
    }

    /**
     * Gets entities returned by execution of generated query builder sql.
     */
    async getMany(): Promise<Entity[]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const results = await this.getRawAndEntities();
        return results.entities;
    }

    /**
     * Gets count - number of entities selected by sql generated by this query builder.
     * Count excludes all limitations set by setFirstResult and setMaxResults methods call.
     */
    async getCount(): Promise<number> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        return this.executeCountQuery({ release: true });
    }

    /**
     * Executes built SQL query and returns entities and overall entities count (without limitation).
     * This method is useful to build pagination.
     */
    async getManyAndCount(): Promise<[Entity[], number]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        try {
            const result = await Promise.all([
                this.executeEntitiesAndRawResults({ release: false }),
                this.executeCountQuery({ release: false })
            ]);
            return [result[0].entities, result[1]];

        } finally {
            if (this.ownQueryRunner) // means we created our own query runner
                await this.queryRunner.release();
        }
    }

    /**
     * Executes built SQL query and returns raw data stream.
     */
    async stream(): Promise<ReadStream> {
        const [sql, parameters] = this.getSqlAndParameters();
        try {
            const releaseFn = () => {
                if (this.ownQueryRunner) // means we created our own query runner
                    return this.queryRunner.release();
                return;
            };
            return this.queryRunner.stream(sql, parameters, releaseFn, releaseFn);

        } finally {
            if (this.ownQueryRunner) // means we created our own query runner
                await this.queryRunner.release();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected join(direction: "INNER"|"LEFT", entityOrProperty: Function|string, aliasName: string, condition?: string, options?: JoinOptions, mapToProperty?: string, isMappingMany?: boolean): void {

        const joinAttribute = new JoinAttribute(this.connection, this.expressionMap);
        joinAttribute.direction = direction;
        joinAttribute.mapToProperty = mapToProperty;
        joinAttribute.options = options;
        joinAttribute.isMappingMany = isMappingMany;
        joinAttribute.entityOrProperty = entityOrProperty; // relationName
        joinAttribute.condition = condition; // joinInverseSideCondition
        // joinAttribute.junctionAlias = joinAttribute.relation.isOwning ? parentAlias + "_" + destinationTableAlias : destinationTableAlias + "_" + parentAlias;
        this.expressionMap.joinAttributes.push(joinAttribute);

        // todo: find and set metadata right there?
        joinAttribute.alias = this.expressionMap.createAlias({
            name: aliasName,
            metadata: joinAttribute.metadata!
        });
        if (joinAttribute.relation && joinAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                name: joinAttribute.junctionAlias,
                metadata: joinAttribute.relation.junctionEntityMetadata
            });
        }
    }

    /**
     * Creates "SELECT FROM" part of SQL query.
     */
    protected createSelectExpression() {

        if (!this.expressionMap.mainAlias)
            throw new Error("Cannot build query because main alias is not set (call qb#from method)");

        // todo throw exception if selects or from is missing

        const allSelects: SelectQuery[] = [];
        const excludedSelects: SelectQuery[] = [];

        const aliasName = this.expressionMap.mainAlias.name;
        const tableName = this.getTableName();

        if (this.expressionMap.mainAlias.hasMetadata) {
            const metadata = this.expressionMap.mainAlias.metadata;
            allSelects.push(...this.buildEscapedEntityColumnSelects(aliasName, metadata));
            excludedSelects.push(...this.findEntityColumnSelects(aliasName, metadata));
        }

        // add selects from joins
        this.expressionMap.joinAttributes
            .forEach(join => {
                if (join.metadata) {
                    allSelects.push(...this.buildEscapedEntityColumnSelects(join.alias.name!, join.metadata));
                    excludedSelects.push(...this.findEntityColumnSelects(join.alias.name!, join.metadata));
                } else {
                    const hasMainAlias = this.expressionMap.selects.some(select => select.selection === join.alias.name);
                    if (hasMainAlias) {
                        allSelects.push({ selection: this.escape(join.alias.name!) + ".*" });
                        excludedSelects.push({ selection: this.escape(join.alias.name!) });
                    }
                }
            });

        if (!this.expressionMap.ignoreParentTablesJoins && this.expressionMap.mainAlias.hasMetadata) {
            const metadata = this.expressionMap.mainAlias.metadata;
            if (metadata.parentEntityMetadata && metadata.parentEntityMetadata.inheritanceType === "class-table" && metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + metadata.parentEntityMetadata.tableName;
                metadata.parentEntityMetadata.columns.forEach(column => {
                    // TODO implement partial select
                    allSelects.push({ selection: this.escape(alias) + "." + this.escape(column.databaseName), aliasName: alias + "_" + column.databaseName });
                });
            }
        }

        // add selects from relation id joins
        // this.relationIdAttributes.forEach(relationIdAttr => {
        // });

        /*if (this.enableRelationIdValues) {
         const parentMetadata = this.aliasMap.getEntityMetadataByAlias(this.aliasMap.mainAlias);
         if (!parentMetadata)
         throw new Error("Cannot get entity metadata for the given alias " + this.aliasMap.mainAlias.name);

         const metadata = this.connection.entityMetadatas.findByTarget(this.aliasMap.mainAlias.target);
         metadata.manyToManyRelations.forEach(relation => {

         const junctionMetadata = relation.junctionEntityMetadata;
         junctionMetadata.columns.forEach(column => {
         const select = ea(this.aliasMap.mainAlias.name + "_" + junctionMetadata.table.name + "_ids") + "." +
         ec(column.name) + " AS " +
         ea(this.aliasMap.mainAlias.name + "_" + relation.name + "_ids_" + column.name);
         allSelects.push(select);
         });
         });
         }*/

        // add all other selects
        this.expressionMap.selects
            .filter(select => excludedSelects.indexOf(select) === -1)
            .forEach(select => allSelects.push({ selection: this.replacePropertyNames(select.selection), aliasName: select.aliasName }));

        // if still selection is empty, then simply set it to all (*)
        if (allSelects.length === 0)
            allSelects.push({ selection: "*" });

        let lock: string = "";
        if (this.connection.driver instanceof SqlServerDriver) {
            switch (this.expressionMap.lockMode) {
                case "pessimistic_read":
                    lock = " WITH (HOLDLOCK, ROWLOCK)";
                    break;
                case "pessimistic_write":
                    lock = " WITH (UPDLOCK, ROWLOCK)";
                    break;
            }
        }

        // create a selection query
        const from = tableName ? this.escape(tableName) : this.expressionMap.mainAlias.subQuery;
        const selection = allSelects.map(select => select.selection + (select.aliasName ? " AS " + this.escape(select.aliasName) : "")).join(", ");
        if ((this.expressionMap.limit || this.expressionMap.offset) && this.connection.driver instanceof OracleDriver) {
            return "SELECT ROWNUM " + this.escape("RN") + "," + selection + " FROM " + from + " " + this.escape(aliasName) + lock;
        }
        return "SELECT " + selection + " FROM " + from + " " + this.escape(aliasName) + lock;
    }

    /**
     * Creates "JOIN" part of SQL query.
     */
    protected createJoinExpression(): string {

        // examples:
        // select from owning side
        // qb.select("post")
        //     .leftJoinAndSelect("post.category", "category");
        // select from non-owning side
        // qb.select("category")
        //     .leftJoinAndSelect("category.post", "post");

        const joins = this.expressionMap.joinAttributes.map(joinAttr => {

            const relation = joinAttr.relation;
            const destinationTableName = joinAttr.tableName;
            const destinationTableAlias = joinAttr.alias.name;
            const appendedCondition = joinAttr.condition ? " AND (" + joinAttr.condition + ")" : "";
            const parentAlias = joinAttr.parentAlias;

            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation)
                return " " + joinAttr.direction + " JOIN " + this.escape(destinationTableName) + " " + this.escape(destinationTableAlias) +
                    (joinAttr.condition ? " ON " + this.replacePropertyNames(joinAttr.condition) : "");

            // if real entity relation is involved
            if (relation.isManyToOne || relation.isOneToOneOwner) {

                // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                const condition = relation.joinColumns.map(joinColumn => {
                    return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" +
                        parentAlias + "." + relation.propertyPath + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                return " " + joinAttr.direction + " JOIN " + this.escape(destinationTableName) + " " + this.escape(destinationTableAlias) + " ON " + this.replacePropertyNames(condition + appendedCondition);

            } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {

                // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                const condition = relation.inverseRelation!.joinColumns.map(joinColumn => {
                    return destinationTableAlias + "." + relation.inverseRelation!.propertyPath + "." + joinColumn.referencedColumn!.propertyPath + "=" +
                        parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                return " " + joinAttr.direction + " JOIN " + this.escape(destinationTableName) + " " + this.escape(destinationTableAlias) + " ON " + this.replacePropertyNames(condition + appendedCondition);

            } else { // means many-to-many
                const junctionTableName = relation.junctionEntityMetadata!.tableName;

                const junctionAlias = joinAttr.junctionAlias;
                let junctionCondition = "", destinationCondition = "";

                if (relation.isOwning) {

                    junctionCondition = relation.joinColumns.map(joinColumn => {
                        // `post_category`.`postId` = `post`.`id`
                        return junctionAlias + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                    }).join(" AND ");

                    destinationCondition = relation.inverseJoinColumns.map(joinColumn => {
                        // `category`.`id` = `post_category`.`categoryId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" + junctionAlias + "." + joinColumn.propertyPath;
                    }).join(" AND ");

                } else {
                    junctionCondition = relation.inverseRelation!.inverseJoinColumns.map(joinColumn => {
                        // `post_category`.`categoryId` = `category`.`id`
                        return junctionAlias + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                    }).join(" AND ");

                    destinationCondition = relation.inverseRelation!.joinColumns.map(joinColumn => {
                        // `post`.`id` = `post_category`.`postId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" + junctionAlias + "." + joinColumn.propertyPath;
                    }).join(" AND ");
                }

                return " " + joinAttr.direction + " JOIN " + this.escape(junctionTableName) + " " + this.escape(junctionAlias) + " ON " + this.replacePropertyNames(junctionCondition) +
                    " " + joinAttr.direction + " JOIN " + this.escape(destinationTableName) + " " + this.escape(destinationTableAlias) + " ON " + this.replacePropertyNames(destinationCondition + appendedCondition);

            }
        });

        if (!this.expressionMap.ignoreParentTablesJoins && this.expressionMap.mainAlias!.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.parentEntityMetadata && metadata.parentEntityMetadata.inheritanceType === "class-table" && metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + metadata.parentEntityMetadata.tableName;
                const condition = metadata.parentIdColumns.map(parentIdColumn => {
                    return this.expressionMap.mainAlias!.name + "." + parentIdColumn.propertyPath + " = " + alias + "." + parentIdColumn.referencedColumn!.propertyPath;
                }).join(" AND ");
                const join = " JOIN " + this.escape(metadata.parentEntityMetadata.tableName) + " " + this.escape(alias) + " ON " + this.replacePropertyNames(condition);
                joins.push(join);
            }
        }

        return joins.join(" ");
    }

    /**
     * Creates "GROUP BY" part of SQL query.
     */
    protected createGroupByExpression() {
        if (!this.expressionMap.groupBys || !this.expressionMap.groupBys.length) return "";
        return " GROUP BY " + this.replacePropertyNames(this.expressionMap.groupBys.join(", "));
    }

    /**
     * Creates "ORDER BY" part of SQL query.
     */
    protected createOrderByExpression() {

        let orderBys = this.expressionMap.orderBys;

        // if table has a default order then apply it
        if (!Object.keys(orderBys).length && this.expressionMap.mainAlias!.hasMetadata) {
            orderBys = this.expressionMap.mainAlias!.metadata.orderBy || {};
        }

        // if user specified a custom order then apply it
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                    .map(columnName => {
                        return this.replacePropertyNames(columnName) + " " + this.expressionMap.orderBys[columnName];
                    })
                    .join(", ");

        return "";
    }

    /**
     * Creates "LIMIT" and "OFFSET" parts of SQL query for Oracle database.
     */
    protected createLimitOffsetOracleSpecificExpression(sql: string): string {
        if ((this.expressionMap.offset || this.expressionMap.limit) && this.connection.driver instanceof OracleDriver) {
            sql = "SELECT * FROM (" + sql + ") WHERE ";
            if (this.expressionMap.offset) {
                sql += this.escape("RN") + " >= " + this.expressionMap.offset;
            }
            if (this.expressionMap.limit) {
                sql += (this.expressionMap.offset ? " AND " : "") + this.escape("RN") + " <= " + ((this.expressionMap.offset || 0) + this.expressionMap.limit);
            }
        }
        return sql;
    }

    /**
     * Creates "LIMIT" and "OFFSET" parts of SQL query.
     */
    protected createLimitOffsetExpression(): string {
        if (this.connection.driver instanceof OracleDriver)
            return "";

        if (this.connection.driver instanceof SqlServerDriver) {

            if (this.expressionMap.limit && this.expressionMap.offset)
                return " OFFSET " + this.expressionMap.offset + " ROWS FETCH NEXT " + this.expressionMap.limit + " ROWS ONLY";
            if (this.expressionMap.limit)
                return " OFFSET 0 ROWS FETCH NEXT " + this.expressionMap.limit + " ROWS ONLY";
            if (this.expressionMap.offset)
                return " OFFSET " + this.expressionMap.offset + " ROWS";

        } else {
            if (this.expressionMap.limit && this.expressionMap.offset)
                return " LIMIT " + this.expressionMap.limit + " OFFSET " + this.expressionMap.offset;
            if (this.expressionMap.limit)
                return " LIMIT " + this.expressionMap.limit;
            if (this.expressionMap.offset)
                return " OFFSET " + this.expressionMap.offset;
        }

        return "";
    }

    /**
     * Creates "LOCK" part of SQL query.
     */
    protected createLockExpression(): string {
        switch (this.expressionMap.lockMode) {
            case "pessimistic_read":
                if (this.connection.driver instanceof MysqlDriver) {
                    return " LOCK IN SHARE MODE";

                } else if (this.connection.driver instanceof PostgresDriver) {
                    return " FOR SHARE";

                } else if (this.connection.driver instanceof SqlServerDriver) {
                    return "";

                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_write":
                if (this.connection.driver instanceof MysqlDriver || this.connection.driver instanceof PostgresDriver) {
                    return " FOR UPDATE";

                } else if (this.connection.driver instanceof SqlServerDriver) {
                    return "";

                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }
            default:
                return "";
        }
    }

    /**
     * Creates "HAVING" part of SQL query.
     */
    protected createHavingExpression() {
        if (!this.expressionMap.havings || !this.expressionMap.havings.length) return "";
        const conditions = this.expressionMap.havings.map((having, index) => {
            switch (having.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + this.replacePropertyNames(having.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + this.replacePropertyNames(having.condition);
                default:
                    return this.replacePropertyNames(having.condition);
            }
        }).join(" ");

        if (!conditions.length) return "";
        return " HAVING " + conditions;
    }

    protected buildEscapedEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const hasMainAlias = this.expressionMap.selects.some(select => select.selection === aliasName);

        const columns: ColumnMetadata[] = hasMainAlias ? metadata.columns : metadata.columns.filter(column => {
            return this.expressionMap.selects.some(select => select.selection === aliasName + "." + column.propertyName);
        });

        return columns.map(column => {
            const selection = this.expressionMap.selects.find(select => select.selection === aliasName + "." + column.propertyName);
            return {
                selection: this.escape(aliasName) + "." + this.escape(column.databaseName),
                aliasName: selection && selection.aliasName ? selection.aliasName : aliasName + "_" + column.databaseName,
                // todo: need to keep in mind that custom selection.aliasName breaks hydrator. fix it later!
            };
        });
    }

    protected findEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const mainSelect = this.expressionMap.selects.find(select => select.selection === aliasName);
        if (mainSelect)
            return [mainSelect];

        return this.expressionMap.selects.filter(select => {
            return metadata.columns.some(column => select.selection === aliasName + "." + column.propertyName);
        });
    }

    protected async executeCountQuery(options: { release: boolean }): Promise<number> {

        const mainAlias = this.expressionMap.mainAlias!.name; // todo: will this work with "fromTableName"?
        const metadata = this.expressionMap.mainAlias!.metadata;

        const distinctAlias = this.escape(mainAlias);
        let countSql = `COUNT(` + metadata.primaryColumns.map((primaryColumn, index) => {
                const propertyName = this.escape(primaryColumn.databaseName);
                if (index === 0) {
                    return `DISTINCT(${distinctAlias}.${propertyName})`;
                } else {
                    return `${distinctAlias}.${propertyName})`;
                }
            }).join(", ") + ") as \"cnt\"";

        const [countQuerySql, countQueryParameters] = new SelectQueryBuilder(this)
            .mergeExpressionMap({ ignoreParentTablesJoins: true })
            .orderBy()
            .offset(undefined)
            .limit(undefined)
            .select(countSql)
            .getSqlAndParameters();

        try {
            const results = await this.queryRunner.query(countQuerySql, countQueryParameters);
            if (!results || !results[0] || !results[0]["cnt"])
                return 0;

            return parseInt(results[0]["cnt"]);

        } finally {
            if (options.release && this.ownQueryRunner) // means we created our own query runner
                await this.queryRunner.release();
        }
    }

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    protected async executeEntitiesAndRawResults(options: { release: boolean }): Promise<{ entities: Entity[], raw: any[] }> {
        try { // we wrap everything into try/catch because in any case scenario we must release created connection

            if (!this.expressionMap.mainAlias)
                throw new Error(`Alias is not set. Use "from" method to set an alias.`);

            if ((this.expressionMap.lockMode === "pessimistic_read" || this.expressionMap.lockMode === "pessimistic_write") && !this.queryRunner.isTransactionActive)
                throw new PessimisticLockTransactionRequiredError();

            if (this.expressionMap.lockMode === "optimistic") {
                const metadata = this.expressionMap.mainAlias.metadata;
                if (!metadata.versionColumn && !metadata.updateDateColumn)
                    throw new NoVersionOrUpdateDateColumnError(metadata.name);
            }

            const broadcaster = new Broadcaster(this.connection);
            const relationIdLoader = new RelationIdLoader(this.connection, this.queryRunner, this.expressionMap.relationIdAttributes);
            const relationCountLoader = new RelationCountLoader(this.connection, this.queryRunner, this.expressionMap.relationCountAttributes);
            const relationIdMetadataTransformer = new RelationIdMetadataToAttributeTransformer(this.expressionMap);
            relationIdMetadataTransformer.transform();
            const relationCountMetadataTransformer = new RelationCountMetadataToAttributeTransformer(this.expressionMap);
            relationCountMetadataTransformer.transform();

            let rawResults: any[] = [], entities: any[] = [];

            // for pagination enabled (e.g. skip and take) its much more complicated - its a special process
            // where we make two queries to find the data we need
            // first query find ids in skip and take range
            // and second query loads the actual data in given ids range
            if (this.expressionMap.skip || this.expressionMap.take) {

                // we are skipping order by here because its not working in subqueries anyway
                // to make order by working we need to apply it on a distinct query
                const [selects, orderBys] = this.createOrderByCombinedWithSelectExpression("distinctAlias");
                const metadata = this.expressionMap.mainAlias.metadata;
                const mainAliasName = this.expressionMap.mainAlias.name;

                const querySelects = metadata.primaryColumns.map(primaryColumn => {
                    const distinctAlias = this.escape("distinctAlias");
                    const columnAlias = this.escape(mainAliasName + "_" + primaryColumn.propertyName);
                    if (!orderBys[columnAlias]) // make sure we aren't overriding user-defined order in inverse direction
                        orderBys[columnAlias] = "ASC";
                    return `${distinctAlias}.${columnAlias} as "ids_${mainAliasName + "_" + primaryColumn.databaseName}"`;
                });

                rawResults = await new SelectQueryBuilder(this.connection, this.queryRunner)
                    .select(`DISTINCT ${querySelects.join(", ")} `)
                    .addSelect(selects)
                    .from(`(${new SelectQueryBuilder(this).orderBy().getQuery()})`, "distinctAlias")
                    .offset(this.expressionMap.skip)
                    .limit(this.expressionMap.take)
                    .orderBy(orderBys)
                    .setParameters(this.getParameters())
                    .getRawMany();

                if (rawResults.length > 0) {
                    let condition = "";
                    const parameters: ObjectLiteral = {};
                    if (metadata.hasMultiplePrimaryKeys) {
                        condition = rawResults.map(result => {
                            return metadata.primaryColumns.map(primaryColumn => {
                                parameters["ids_" + primaryColumn.propertyName] = result["ids_" + primaryColumn.databaseName];
                                return mainAliasName + "." + primaryColumn.propertyName + "=:ids_" + primaryColumn.databaseName;
                            }).join(" AND ");
                        }).join(" OR ");
                    } else {
                        const ids = rawResults.map(result => result["ids_" + mainAliasName + "_" + metadata.primaryColumns[0].databaseName]);
                        const areAllNumbers = ids.every((id: any) => typeof id === "number");
                        if (areAllNumbers) {
                            // fixes #190. if all numbers then its safe to perform query without parameter
                            condition = `${mainAliasName}.${metadata.primaryColumns[0].propertyName} IN (${ids.join(", ")})`;
                        } else {
                            parameters["ids"] = ids;
                            condition = mainAliasName + "." + metadata.primaryColumns[0].propertyName + " IN (:ids)";
                        }
                    }
                    rawResults = await new SelectQueryBuilder(this)
                        .mergeExpressionMap({ extraAppendedAndWhereCondition: condition })
                        .setParameters(parameters)
                        .getRawMany();
                }

            } else {
                const [sql, parameters] = this.getSqlAndParameters();
                rawResults = await this.queryRunner.query(sql, parameters);
            }

            if (rawResults.length > 0) {

                // transform raw results into entities
                const rawRelationIdResults = await relationIdLoader.load(rawResults);
                const rawRelationCountResults = await relationCountLoader.load(rawResults);
                const transformer = new RawSqlResultsToEntityTransformer(this.connection.driver, this.expressionMap.joinAttributes, rawRelationIdResults, rawRelationCountResults);
                entities = transformer.transform(rawResults, this.expressionMap.mainAlias!);

                // broadcast all "after load" events
                if (this.expressionMap.mainAlias.hasMetadata)
                    await broadcaster.broadcastLoadEventsForAll(this.expressionMap.mainAlias.target, rawResults);
            }

            return {
                raw: rawResults,
                entities: entities,
            };

        } finally {
            if (options.release && this.ownQueryRunner) // means we created our own query runner
                await this.queryRunner.release();
        }
    }

    protected createOrderByCombinedWithSelectExpression(parentAlias: string): [ string, OrderByCondition] {

        // if table has a default order then apply it
        let orderBys = this.expressionMap.orderBys;
        if (!Object.keys(orderBys).length && this.expressionMap.mainAlias!.hasMetadata) {
            orderBys = this.expressionMap.mainAlias!.metadata.orderBy || {};
        }

        const selectString = Object.keys(orderBys)
            .map(columnName => {
                const [alias, column, ...embeddedProperties] = columnName.split(".");
                return this.escape(parentAlias) + "." + this.escape(alias + "_" + column + embeddedProperties.join("_"));
            })
            .join(", ");

        const orderByObject: OrderByCondition = {};
        Object.keys(orderBys).forEach(columnName => {
            const [alias, column, ...embeddedProperties] = columnName.split(".");
            orderByObject[this.escape(parentAlias) + "." + this.escape(alias + "_" + column + embeddedProperties.join("_"))] = this.expressionMap.orderBys[columnName];
        });

        return [selectString, orderByObject];
    }

    /**
     * Merges into expression map given expression map properties.
     */
    protected mergeExpressionMap(expressionMap: Partial<QueryExpressionMap>): this {
        Object.assign(this.expressionMap, expressionMap);
        return this;
    }

}
