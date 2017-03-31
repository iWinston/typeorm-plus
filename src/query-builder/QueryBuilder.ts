import {RawSqlResultsToEntityTransformer} from "./transformer/RawSqlResultsToEntityTransformer";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {Connection} from "../connection/Connection";
import {JoinOptions} from "./JoinOptions";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {PessimisticLockTransactionRequiredError} from "./error/PessimisticLockTransactionRequiredError";
import {NoVersionOrUpdateDateColumnError} from "./error/NoVersionOrUpdateDateColumnError";
import {OptimisticLockVersionMismatchError} from "./error/OptimisticLockVersionMismatchError";
import {OptimisticLockCanNotBeUsedError} from "./error/OptimisticLockCanNotBeUsedError";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";
import {LockNotSupportedOnGivenDriverError} from "./error/LockNotSupportedOnGivenDriverError";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {JoinAttribute} from "./JoinAttribute";
import {RelationIdAttribute} from "./RelationIdAttribute";
import {RelationCountAttribute} from "./RelationCountAttribute";
import {QueryExpressionMap} from "./QueryExpressionMap";
import {SelectQuery} from "./SelectQuery";


// todo: fix problem with long aliases eg getMaxIdentifierLength
// todo: fix replacing in .select("COUNT(post.id) AS cnt") statement
// todo: implement joinAlways in relations and relationId
// todo: implement @Where decorator
// todo: add quoting functions
// todo: .addCount and .addCountSelect()
// todo: add selectAndMap

// todo: tests for:
// todo: entityOrProperty can be a table name. implement if its a table
// todo: entityOrProperty can be target name. implement proper behaviour if it is.
// todo: think about subselect in joins syntax
// todo: create multiple representations of QueryBuilder: UpdateQueryBuilder, DeleteQueryBuilder
// qb.update() returns UpdateQueryBuilder
// qb.delete() returns DeleteQueryBuilder
// qb.select() returns SelectQueryBuilder

// todo: SUBSELECT IMPLEMENTATION
// .whereSubselect(qb => qb.select().from().where())
// todo: also create qb.createSubQueryBuilder()

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Protected properties
    // -------------------------------------------------------------------------

    /**
     * Contains all properties of the QueryBuilder that needs to be build a final query.
     */
    protected expressionMap: QueryExpressionMap;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunnerProvider?: QueryRunnerProvider) {
        this.expressionMap = new QueryExpressionMap(connection);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the main alias string used in this query builder.
     */
    get alias(): string {
        if (!this.expressionMap.mainAlias)
            throw new Error(`Main alias is not set`); // todo: better exception

        return this.expressionMap.mainAlias.name;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string, selectionAliasName?: string): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string[]): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection?: string|string[], selectionAliasName?: string): this {
        this.expressionMap.queryType = "select";
        if (selection instanceof Array) {
            this.expressionMap.selects = selection.map(selection => ({ selection: selection }));
        } else if (selection) {
            this.expressionMap.selects = [{ selection: selection, aliasName: selectionAliasName }];
        }
        return this;
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
        if (selection instanceof Array) {
            this.expressionMap.selects = this.expressionMap.selects.concat(selection.map(selection => ({ selection: selection })));
        } else {
            this.expressionMap.selects.push({ selection: selection, aliasName: selectionAliasName });
        }

        return this;
    }

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(updateSet: ObjectLiteral): this;

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update(entity: Function|string, updateSet: ObjectLiteral): this;

    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(tableName: string, updateSet: ObjectLiteral): this;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(entityOrTableNameUpdateSet?: string|Function|ObjectLiteral, maybeUpdateSet?: ObjectLiteral): this {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : entityOrTableNameUpdateSet as ObjectLiteral|undefined;

        if (entityOrTableNameUpdateSet instanceof Function) { // entityOrTableNameUpdateSet is entity class
            this.expressionMap.createMainAlias({
                target: entityOrTableNameUpdateSet
            });

        } else if (typeof entityOrTableNameUpdateSet === "string") { // todo: check if entityOrTableNameUpdateSet is entity target string
            this.expressionMap.createMainAlias({
                tableName: entityOrTableNameUpdateSet
            });
        }

        this.expressionMap.queryType = "update";
        this.expressionMap.updateSet = updateSet;
        return this;
    }

    /**
     * Creates DELETE query.
     */
    delete(): this {
        this.expressionMap.queryType = "delete";
        return this;
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from(entityTarget: Function|string, aliasName: string): this {
        this.expressionMap.createMainAlias({
            name: aliasName,
            target: entityTarget
        });
        return this;
    }

    /**
     * Specifies FROM which table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    fromTable(tableName: string, aliasName: string) {

        // if table has a metadata then find it to properly escape its properties
        const metadata = this.connection.entityMetadatas.find(metadata => metadata.table.name === tableName);
        if (metadata) {
            this.expressionMap.createMainAlias({
                name: aliasName,
                metadata: metadata,
            });

        } else {
            this.expressionMap.createMainAlias({
                name: aliasName,
                tableName: tableName,
            });
        }
        return this;
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
    leftJoinAndSelect(entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

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
    innerJoinAndMapMany(mapToProperty: string, entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

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
    innerJoinAndMapOne(mapToProperty: string, entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * INNER JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

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
    leftJoinAndMapMany(mapToProperty: string, entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

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
    leftJoinAndMapOne(mapToProperty: string, entity: Function|string, aliasName: string, condition?: string, options?: JoinOptions): this;

    /**
     * LEFT JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, tableName: string, aliasName: string, condition?: string, options?: JoinOptions): this;

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
    loadRelationIdAndMap(mapToProperty: string, relationName: string, aliasName: string, queryBuilderAppender: (qb: QueryBuilder<any>) => QueryBuilder<any>): this;
    loadRelationIdAndMap(mapToProperty: string, relationName: string, aliasName?: string, queryBuilderAppender?: (qb: QueryBuilder<any>) => QueryBuilder<any>): this {
        this.buildRelationAttribute(mapToProperty, relationName, aliasName, queryBuilderAppender);
        return this;
    }

    /**
     * Counts number of entities of entity's relation.
     * Optionally, you can add condition and parameters used in condition.
     */
    countRelation(relationName: string, condition?: string): this {
        this.countRelationX(undefined, relationName, condition);
        return this;
    }

    /**
     * Counts number of entities of entity's relation and maps the value into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    countRelationAndMap(mapToProperty: string, relationName: string, condition?: string): this {
        this.countRelationX(mapToProperty, relationName, condition);
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
     */
    orderBy(sort: string, order?: "ASC"|"DESC"): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(undefined: undefined): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(sort?: string, order: "ASC"|"DESC" = "ASC"): this {
        if (sort) {
            this.expressionMap.orderBys = { [sort]: order };
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
    setLimit(limit?: number): this {
        this.expressionMap.limit = limit;
        return this;
    }

    /**
     * Set's OFFSET - selection offset.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead skip method instead.
     */
    setOffset(offset?: number): this {
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
     * Sets number of entities to skip
     */
    skip(skip?: number): this {
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
     * Sets given parameter's value.
     */
    setParameter(key: string, value: any): this {
        this.expressionMap.parameters[key] = value;
        return this;
    }

    /**
     * Adds all parameters from the given object.
     */
    setParameters(parameters: ObjectLiteral): this {
        Object.keys(parameters).forEach(key => {
            this.expressionMap.parameters[key] = parameters[key];
        });
        return this;
    }

    /**
     * Gets all parameters.
     */
    getParameters(): ObjectLiteral {
        const parameters: ObjectLiteral = Object.assign({}, this.expressionMap.parameters);

        // add discriminator column parameter if it exist
        if (this.expressionMap.mainAlias!.hasMetadata) {
            if (this.expressionMap.mainAlias!.metadata.hasDiscriminatorColumn)
                parameters["discriminatorColumnValue"] = this.expressionMap.mainAlias!.metadata.discriminatorValue;
        }

        return parameters;
    }

    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    getSql(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        sql += this.createLockExpression();
        [sql] = this.connection.driver.escapeQueryWithParameters(sql, this.expressionMap.parameters);
        return sql.trim();
    }

    /**
     * Gets generated sql without parameters being replaced.
     */
    getGeneratedQuery(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        sql += this.createLockExpression();
        return sql.trim();
    }

    /**
     * Gets sql to be executed with all parameters used in it.
     */
    getSqlWithParameters(options?: { skipOrderBy?: boolean }): [string, any[]] {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        if (!options || !options.skipOrderBy)
            sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        sql += this.createLockExpression();
        return this.connection.driver.escapeQueryWithParameters(sql, this.getParameters());
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<any> {
        const queryRunner = await this.getQueryRunner();
        const [sql, parameters] = this.getSqlWithParameters();
        try {
            return await queryRunner.query(sql, parameters);  // await is needed here because we are using finally

        } finally {
            if (this.hasOwnQueryRunner()) // means we created our own query runner
                await queryRunner.release();
        }
    }

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    async getEntitiesAndRawResults(): Promise<{ entities: Entity[], rawResults: any[] }> {
        const queryRunner = await this.getQueryRunner();

        try {
            if (!this.expressionMap.mainAlias)
                throw new Error(`Alias is not set. Looks like nothing is selected. Use select*, delete, update method to set an alias.`);

            if ((this.expressionMap.lockMode === "pessimistic_read" || this.expressionMap.lockMode === "pessimistic_write") && !queryRunner.isTransactionActive())
                throw new PessimisticLockTransactionRequiredError();

            if (this.expressionMap.lockMode === "optimistic") {
                const metadata = this.expressionMap.mainAlias!.metadata;
                if (!metadata.hasVersionColumn && !metadata.hasUpdateDateColumn)
                    throw new NoVersionOrUpdateDateColumnError(metadata.name);
            }

            const mainAliasName = this.expressionMap.mainAlias.name;
            if (this.expressionMap.skip || this.expressionMap.take) {
                // we are skipping order by here because its not working in subqueries anyway
                // to make order by working we need to apply it on a distinct query
                const [sql, parameters] = this.getSqlWithParameters({ skipOrderBy: true });
                const [selects, orderBys] = this.createOrderByCombinedWithSelectExpression("distinctAlias");

                const distinctAlias = this.escapeTable("distinctAlias");
                const metadata = this.expressionMap.mainAlias!.metadata;
                let idsQuery = `SELECT `;
                idsQuery += metadata.primaryColumns.map((primaryColumn, index) => {
                    const propertyName = this.escapeAlias(mainAliasName + "_" + primaryColumn.fullName);
                    if (index === 0) {
                        return `DISTINCT(${distinctAlias}.${propertyName}) as ids_${primaryColumn.fullName}`;
                    } else {
                        return `${distinctAlias}.${propertyName}) as ids_${primaryColumn.fullName}`;
                    }
                }).join(", ");
                if (selects.length > 0)
                    idsQuery += ", " + selects;

                idsQuery += ` FROM (${sql}) ${distinctAlias}`; // TODO: WHAT TO DO WITH PARAMETERS HERE? DO THEY WORK?

                if (orderBys.length > 0) {
                    idsQuery += " ORDER BY " + orderBys;
                } else {
                    idsQuery += ` ORDER BY "ids_${metadata.firstPrimaryColumn.fullName}"`; // this is required for mssql driver if firstResult is used. Other drivers don't care about it
                }

                if (this.connection.driver instanceof SqlServerDriver) { // todo: temporary. need to refactor and make a proper abstraction

                    if (this.expressionMap.skip || this.expressionMap.take) {
                        idsQuery += ` OFFSET ${this.expressionMap.skip || 0} ROWS`;
                        if (this.expressionMap.take)
                            idsQuery += " FETCH NEXT " + this.expressionMap.take + " ROWS ONLY";
                    }
                } else {

                    if (this.expressionMap.take)
                        idsQuery += " LIMIT " + this.expressionMap.take;
                    if (this.expressionMap.skip)
                        idsQuery += " OFFSET " + this.expressionMap.skip;
                }

                let entities: any[] = [];
                let rawResults: any[] = await queryRunner.query(idsQuery, parameters);
                if (rawResults.length > 0) {
                    let condition = "";
                    const parameters: ObjectLiteral = {};
                    if (metadata.hasMultiplePrimaryKeys) {
                        condition = rawResults.map(result => {
                            return metadata.primaryColumns.map(primaryColumn => {
                                parameters["ids_" + primaryColumn.propertyName] = result["ids_" + primaryColumn.propertyName];
                                return mainAliasName + "." + primaryColumn.propertyName + "=:ids_" + primaryColumn.propertyName;
                            }).join(" AND ");
                        }).join(" OR ");
                    } else {
                        const ids = rawResults.map(result => result["ids_" + metadata.firstPrimaryColumn.propertyName]);
                        const areAllNumbers = ids.map((id: any) => typeof id === "number");
                        if (areAllNumbers) {
                            // fixes #190. if all numbers then its safe to perform query without parameter
                            condition = `${mainAliasName}.${metadata.firstPrimaryColumn.propertyName} IN (${ids.join(", ")})`;
                        } else {
                            parameters["ids"] = ids;
                            condition = mainAliasName + "." + metadata.firstPrimaryColumn.propertyName + " IN (:ids)";
                        }
                    }
                    const [queryWithIdsSql, queryWithIdsParameters] = this.clone({queryRunnerProvider: this.queryRunnerProvider})
                        .andWhere(condition, parameters)
                        .getSqlWithParameters();
                    rawResults = await queryRunner.query(queryWithIdsSql, queryWithIdsParameters);
                    this.createRelationIdAttributesFromDecorators(rawResults);
                    const rawRelationIdResults = await this.loadRelationIds(rawResults);
                    entities = this.rawResultsToEntities(rawResults, rawRelationIdResults);
                    await this.loadRelationCounts(queryRunner);
                    if (this.expressionMap.mainAlias.hasMetadata)
                        await this.connection.broadcaster.broadcastLoadEventsForAll(this.expressionMap.mainAlias.target, rawResults);

                }
                return {
                    entities: entities,
                    rawResults: rawResults
                };

            } else {

                const [sql, parameters] = this.getSqlWithParameters();

                const rawResults = await queryRunner.query(sql, parameters);
                this.createRelationIdAttributesFromDecorators(rawResults);
                const rawRelationIdResults = await this.loadRelationIds(rawResults);
                const entities = this.rawResultsToEntities(rawResults, rawRelationIdResults);
                await this.loadRelationCounts(queryRunner);
                if (this.expressionMap.mainAlias.hasMetadata)
                    await this.connection.broadcaster.broadcastLoadEventsForAll(this.expressionMap.mainAlias.target, rawResults);

                return {
                    entities: entities,
                    rawResults: rawResults
                };
            }

        } finally {
            if (this.hasOwnQueryRunner()) // means we created our own query runner
                await queryRunner.release();
        }
    }

    /**
     * Creates RelationIdAttributes from RelationIdMetadata (created by @RelationId decorators or in schemas).
     */
    protected createRelationIdAttributesFromDecorators(rawResults: any[]) {

        // by example:
        // post has relation id:
        // @RelationId(post => post.categories) categoryIds
        // category has relation id
        // @RelationId(category => category.images) imageIds
        // we load post and join category
        // we expect post.categoryIds and post.category.imageIds to have relation ids

        // first create relation id attributes for all relation id metadatas of the main selected object (post from example)
        if (this.expressionMap.mainAlias) {
            this.expressionMap.mainAlias.metadata.relations.forEach(relation => { // todo: should be metadata.relationIds
                if (!relation.idField)
                    return;

                this.expressionMap.relationIdAttributes.push(new RelationIdAttribute(this.expressionMap, {
                    relationName: this.expressionMap.mainAlias!.name + "." + relation.propertyName, // post.categories
                    mapToProperty: this.expressionMap.mainAlias!.name + "." + relation.idField // post.categoryIds
                }));
            });
        }

        // second create relation id attributes for all relation id metadatas of all joined objects (category from example)
        this.expressionMap.joinAttributes.forEach(join => {

            // ensure this join has a metadata, because relation id can only work for real orm entities
            if (!join.metadata || join.metadata.junction)
                return;

            // ensure we won't perform redundant queries for joined data which was not found in selection
            // example: if post.category was not found in db then no need to execute query for category.imageIds
            // todo: think more about this, same rules apply when using loadRelationIdAndMap without decorators but such check not present there
            if (!rawResults.some(rawResult => !!rawResult[join.alias + "_" + join.metadata!.primaryColumns[0].fullName]))
                return;

            // todo: refactor and use join.metadata.relationIds
            join.metadata.relations.forEach(relation => {
                if (!relation.idField)
                    return;

                this.expressionMap.relationIdAttributes.push(new RelationIdAttribute(this.expressionMap, {
                    relationName: join.alias + "." + relation.propertyName, // category.images
                    mapToProperty: join.alias + "." + relation.idField // category.imageIds
                }));
            });
        });
    }

    /**
     * Gets count - number of entities selected by sql generated by this query builder.
     * Count excludes all limitations set by setFirstResult and setMaxResults methods call.
     */
    async getCount(): Promise<number> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const queryRunner = await this.getQueryRunner();

        const mainAlias = this.expressionMap.mainAlias!.name; // todo: will this work with "fromTableName"?
        const metadata = this.expressionMap.mainAlias!.metadata;

        const distinctAlias = this.escapeAlias(mainAlias);
        let countSql = `COUNT(` + metadata.primaryColumnsWithParentIdColumns.map((primaryColumn, index) => {
                const propertyName = this.escapeColumn(primaryColumn.fullName);
                if (index === 0) {
                    return `DISTINCT(${distinctAlias}.${propertyName})`;
                } else {
                    return `${distinctAlias}.${propertyName})`;
                }
            }).join(", ") + ") as cnt";

        const countQueryBuilder = this
            .clone({ queryRunnerProvider: this.queryRunnerProvider })
            .orderBy(undefined)
            .setOffset(undefined)
            .setLimit(undefined)
            .select(countSql);
        countQueryBuilder.expressionMap.ignoreParentTablesJoins = true;

        const [countQuerySql, countQueryParameters] = countQueryBuilder.getSqlWithParameters();

        try {
            const results = await queryRunner.query(countQuerySql, countQueryParameters);
            if (!results || !results[0] || !results[0]["cnt"])
                return 0;

            return parseInt(results[0]["cnt"]);

        } finally {
            if (this.hasOwnQueryRunner()) // means we created our own query runner
                await queryRunner.release();
        }
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
     * Gets first raw result returned by execution of generated query builder sql.
     */
    async getRawOne(): Promise<any> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const results = await this.execute();
        return results[0];

    }

    /**
     * Gets entities and count returned by execution of generated query builder sql.
     */
    async getManyAndCount(): Promise<[Entity[], number]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        // todo: share database connection and counter
        return Promise.all([
            this.getMany(),
            this.getCount()
        ]);
    }

    /**
     * Gets entities returned by execution of generated query builder sql.
     */
    async getMany(): Promise<Entity[]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const results = await this.getEntitiesAndRawResults();
        return results.entities;
    }

    /**
     * Gets single entity returned by execution of generated query builder sql.
     */
    async getOne(): Promise<Entity|undefined> {
        const results = await this.getEntitiesAndRawResults();
        const result = results.entities[0] as any;

        if (result && this.expressionMap.lockMode === "optimistic" && this.expressionMap.lockVersion) {
            const metadata = this.expressionMap.mainAlias!.metadata;

            if (this.expressionMap.lockVersion instanceof Date) {
                const actualVersion = result[metadata.updateDateColumn.propertyName];
                this.expressionMap.lockVersion.setMilliseconds(0);
                if (actualVersion.getTime() !== this.expressionMap.lockVersion.getTime())
                    throw new OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);

            } else {
                const actualVersion = result[metadata.versionColumn.propertyName];
                if (actualVersion !== this.expressionMap.lockVersion)
                    throw new OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
            }
        }

        return result;
    }

    /**
     * Clones query builder as it is.
     */
    clone(options?: { queryRunnerProvider?: QueryRunnerProvider }): QueryBuilder<Entity> {
        const qb = new QueryBuilder(this.connection, options ? options.queryRunnerProvider : undefined);
        qb.expressionMap = this.expressionMap.clone();
        return qb;
    }

    /**
     * Disables escaping.
     */
    disableEscaping(): this {
        this.expressionMap.disableEscaping = false;
        return this;
    }

    /**
     * Escapes alias name using current database's escaping character.
     */
    escapeAlias(name: string) {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escapeAliasName(name);
    }

    /**
     * Escapes column name using current database's escaping character.
     */
    escapeColumn(name: string) {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escapeColumnName(name);
    }

    /**
     * Escapes table name using current database's escaping character.
     */
    escapeTable(name: string) {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escapeTableName(name);
    }

    /**
     * Enables special query builder options.
     *
     * @deprecated looks like enableRelationIdValues is not used anymore. What to do? Remove this method? What about persistence?
     */
    enableOption(option: "RELATION_ID_VALUES"): this {
        switch (option) {
            case "RELATION_ID_VALUES":
                this.expressionMap.enableRelationIdValues = true;
        }

        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * @experimental Maybe this method should be moved to repository?
     * @deprecated
     */
    andWhereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.andWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     *
     * @experimental Maybe this method should be moved to repository?
     * @deprecated
     */
    orWhereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.orWhere(whereExpression, parameters);
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected join(direction: "INNER"|"LEFT", entityOrProperty: Function|string, aliasName: string, condition?: string, options?: JoinOptions, mapToProperty?: string, isMappingMany: boolean = false): void {

        const joinAttribute = new JoinAttribute(this.connection, this.expressionMap);
        joinAttribute.alias = aliasName; // joinInverseSideAlias
        joinAttribute.direction = direction;
        joinAttribute.mapToProperty = mapToProperty;
        joinAttribute.options = options;
        joinAttribute.isMappingMany = isMappingMany;
        joinAttribute.entityOrProperty = entityOrProperty; // relationName
        joinAttribute.condition = condition; // joinInverseSideCondition
        // joinAttribute.junctionAlias = joinAttribute.relation.isOwning ? parentAlias + "_" + destinationTableAlias : destinationTableAlias + "_" + parentAlias;
        this.expressionMap.joinAttributes.push(joinAttribute);

        // todo: this is temporary, remove after selection refactoring
        this.expressionMap.createAlias({
            name: joinAttribute.alias,
            metadata: joinAttribute.metadata!
        });
    }

    protected buildRelationAttribute(mapToProperty: string, relationName: string, alias?: string, queryBuilderAppender?: (qb: QueryBuilder<any>) => QueryBuilder<any>): void {
        const relationIdAttribute = new RelationIdAttribute(this.expressionMap);
        relationIdAttribute.mapToProperty = mapToProperty;
        relationIdAttribute.relationName = relationName;
        relationIdAttribute.alias = alias;
        relationIdAttribute.queryBuilderFactory = queryBuilderAppender;
        this.expressionMap.relationIdAttributes.push(relationIdAttribute);
    }

    protected async loadRelationIds(rawEntities: any[]): Promise<{ relationIdAttribute: RelationIdAttribute, results: { id: any, parentId: any }[] }[]> {

        const promises = this.expressionMap.relationIdAttributes.map(async relationIdAttr => {

            if (relationIdAttr.relation.isManyToOne || relationIdAttr.relation.isOneToOneOwner) {
                // example: Post and Tag
                // loadRelationIdAndMap("post.tagId", "post.tag") post_tag
                // we expect it to load id of tag

                if (relationIdAttr.queryBuilderFactory)
                    throw new Error("");

                const referenceColumnName = relationIdAttr.relation.joinColumn.referencedColumn.propertyName; // post id
                const results = rawEntities.map(rawEntity => {
                    return {
                        id: rawEntity[relationIdAttr.parentAlias + "_" + relationIdAttr.relationProperty], // todo: custom alias for column wont work here
                        parentId: rawEntity[relationIdAttr.parentAlias + "_" + referenceColumnName] // todo: custom alias for column wont work here
                    };
                });

                return {
                    relationIdAttribute: relationIdAttr,
                    results: results
                };

            } else if (relationIdAttr.relation.isOneToMany || relationIdAttr.relation.isOneToOneNotOwner) {
                // example: Post and Category
                // loadRelationIdAndMap("category.postIds", "category.posts")
                // we expect it to load array of post ids

                // todo: take post ids - they can be multiple
                // todo: create test with multiple primary columns usage

                const relation = relationIdAttr.relation; // "category.posts"
                const inverseRelation = relation.inverseRelation; // "post.category"
                const referenceColumnName = inverseRelation.joinColumn.referencedColumn.propertyName; // post id
                const inverseSideTable = relation.inverseEntityMetadata.table.target; // Post
                const inverseSideTableName = relation.inverseEntityMetadata.table.name; // post
                const inverseSideTableAlias = relationIdAttr.alias || inverseSideTableName; // if condition (custom query builder factory) is set then relationIdAttr.alias defined
                const inverseSidePropertyName = inverseRelation.propertyName; // "category" from "post.category"
                const referenceColumnValues = rawEntities
                    .map(rawEntity => rawEntity[relationIdAttr.parentAlias + "_" + referenceColumnName]) // todo: custom alias for column wont work here
                    .filter(value => value !== undefined);

                // generate query:
                // SELECT post.id AS id, category.id AS parentId FROM post post INNER JOIN category category ON category.id=post.category AND category.id IN [:categoryIds]
                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider)
                    .select(inverseSideTableAlias + "." + referenceColumnName, "id") // todo: referenceColumnName is wrong here, use multiple primary columns instead
                    .addSelect(inverseSidePropertyName + "." + referenceColumnName, "parentId")
                    .from(inverseSideTable, inverseSideTableAlias)
                    .innerJoin(inverseSideTableAlias + "." + inverseSidePropertyName, inverseSidePropertyName, inverseSidePropertyName + "." + referenceColumnName + " IN (" + referenceColumnValues + ")");

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: await qb.getRawMany()
                };

            } else {
                // example: Post and Category
                // owner side: loadRelationIdAndMap("post.categoryIds", "post.categories")
                // inverse side: loadRelationIdAndMap("category.postIds", "category.posts")
                // we expect it to load array of post ids

                let joinTableColumnName: string;
                let inverseJoinColumnName: string;
                let firstJunctionColumn: ColumnMetadata;
                let secondJunctionColumn: ColumnMetadata;

                if (relationIdAttr.relation.isOwning) {
                    joinTableColumnName = relationIdAttr.relation.joinTable.referencedColumn.fullName;
                    inverseJoinColumnName = relationIdAttr.relation.joinTable.inverseReferencedColumn.fullName;
                    firstJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[0];
                    secondJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[1];

                } else {
                    joinTableColumnName = relationIdAttr.relation.inverseRelation.joinTable.inverseReferencedColumn.fullName;
                    inverseJoinColumnName = relationIdAttr.relation.inverseRelation.joinTable.referencedColumn.fullName;
                    firstJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[1];
                    secondJunctionColumn = relationIdAttr.relation.junctionEntityMetadata.columnsWithoutEmbeddeds[0];
                }

                const referenceColumnValues = rawEntities
                    .map(rawEntity => rawEntity[relationIdAttr.parentAlias + "_" + joinTableColumnName]) // todo: custom alias for column wont work here
                    .filter(value => value !== undefined);
                const junctionAlias = relationIdAttr.junctionAlias;
                const inverseSideTableName = relationIdAttr.joinInverseSideMetadata.table.name;
                const inverseSideTableAlias = relationIdAttr.alias || inverseSideTableName;
                const junctionTableName = relationIdAttr.relation.junctionEntityMetadata.table.name;
                const condition = junctionAlias + "." + firstJunctionColumn.propertyName + " IN (" + referenceColumnValues + ")" +
                    " AND " + junctionAlias + "." + secondJunctionColumn.propertyName + " = " + inverseSideTableAlias + "." + inverseJoinColumnName;

                const qb = new QueryBuilder(this.connection, this.queryRunnerProvider)
                    .select(inverseSideTableAlias + "." + inverseJoinColumnName, "id")
                    .addSelect(junctionAlias + "." + firstJunctionColumn.propertyName, "parentId")
                    .fromTable(inverseSideTableName, inverseSideTableAlias)
                    .innerJoin(junctionTableName, junctionAlias, condition);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: await qb.getRawMany()
                };
            }
        });

        return Promise.all(promises);
    }

    protected async loadRelationCounts(queryRunner: QueryRunner): Promise<{}> {

        const promises = this.expressionMap.relationCountAttributes.map(async relationCountAttr => {
            const parentMetadata = relationCountAttr.metadata;
            const relation = relationCountAttr.relation;

            const ids = relationCountAttr.entities
                .map(entityWithMetadata => entityWithMetadata.metadata.getEntityIdMap(entityWithMetadata.entity))
                .filter(idMap => idMap !== undefined)
                .map(idMap => idMap![parentMetadata.primaryColumn.propertyName]);

            if (!ids || !ids.length)
                return Promise.resolve(); // todo: need to set zero to relationCount column in this case?

            const results: { id: any, cnt: any }[] = await new QueryBuilder(this.connection, this.queryRunnerProvider)
                .select(`${parentMetadata.name + "." + parentMetadata.primaryColumn.propertyName} AS id`)
                .addSelect(`COUNT(${ this.escapeAlias(relation.propertyName) + "." + this.escapeColumn(relation.inverseEntityMetadata.primaryColumn.fullName) }) as cnt`)
                .from(parentMetadata.target, parentMetadata.name)
                .leftJoin(parentMetadata.name + "." + relation.propertyName, relation.propertyName, relationCountAttr.condition)
                .setParameters(this.expressionMap.parameters)
                .where(`${parentMetadata.name + "." + parentMetadata.primaryColumn.propertyName} IN (:relationCountIds)`, {relationCountIds: ids})
                .groupBy(parentMetadata.name + "." + parentMetadata.primaryColumn.propertyName)
                .getRawMany();

            relationCountAttr.entities.forEach(entityWithMetadata => {
                const entityId = entityWithMetadata.entity[entityWithMetadata.metadata.primaryColumn.propertyName];
                const entityResult = results.find(result => {
                    return entityId === this.connection.driver.prepareHydratedValue(result.id, entityWithMetadata.metadata.primaryColumn);
                });
                if (entityResult) {
                    if (relationCountAttr.mapToProperty) {
                        const [parentName, propertyName] = (relationCountAttr.mapToProperty as string).split(".");
                        // todo: right now mapping is working only on the currently countRelation class, but
                        // different properties are working. make different classes to work too
                        entityWithMetadata.entity[propertyName] = parseInt(entityResult.cnt);

                    } else if (relation.countField) {
                        entityWithMetadata.entity[relation.countField] = parseInt(entityResult.cnt);
                    }
                }
            });
        });

        return Promise.all(promises);
    }

    protected rawResultsToEntities(results: any[], rawRelationIdResults: any[]) {
        const transformer = new RawSqlResultsToEntityTransformer(
            this.connection.driver,
            this.expressionMap
        );
        return transformer.transform(results, rawRelationIdResults);
    }

    protected buildEscapedEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const hasMainAlias = this.expressionMap.selects.some(select => select.selection === aliasName);

        const columns: ColumnMetadata[] = hasMainAlias ? metadata.columns : metadata.columns.filter(column => {
            return this.expressionMap.selects.some(select => select.selection === aliasName + "." + column.propertyName);
        });

        return columns.map(column => {
            const selection = this.expressionMap.selects.find(select => select.selection === aliasName + "." + column.propertyName);
            return {
                selection: this.escapeAlias(aliasName) + "." + this.escapeColumn(column.fullName),
                aliasName: selection && selection.aliasName ? selection.aliasName : aliasName + "_" + column.fullName,
                // todo: need to keep in mind that custom selection.aliasName breaks hydrator. fix it later!
            };
            // return this.escapeAlias(aliasName) + "." + this.escapeColumn(column.fullName) +
            //     " AS " + this.escapeAlias(aliasName + "_" + column.fullName);
        });
    };

    protected findEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const mainSelect = this.expressionMap.selects.find(select => select.selection === aliasName);
        if (mainSelect)
            return [mainSelect];

        return this.expressionMap.selects.filter(select => {
            return metadata.columns.some(column => select.selection === aliasName + "." + column.propertyName);
        });
    }

    /**
     * Counts number of entities of entity's relation and maps the value into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    protected countRelationX(mapToProperty: string|undefined, relationName: string, condition?: string): void {
        // todo: add support of entity targets and custom table names
        const relationCountAttribute = new RelationCountAttribute(this.expressionMap);
        relationCountAttribute.mapToProperty = mapToProperty;
        relationCountAttribute.relationName = relationName;
        relationCountAttribute.condition = condition;
        this.expressionMap.relationCountAttributes.push(relationCountAttribute);

        this.expressionMap.createAlias({
            name: relationCountAttribute.junctionAlias
        });
    }

    // todo: extract all create expression methods to separate class QueryExpressionBuilder

    protected createSelectExpression() {

        if (!this.expressionMap.mainAlias)
            throw new Error("Cannot build query because main alias is not set (call qb#from method)");

        // separate escaping functions are used to reduce code size and complexity below
        const et = (aliasName: string) => this.escapeTable(aliasName);
        const ea = (aliasName: string) => this.escapeAlias(aliasName);
        const ec = (aliasName: string) => this.escapeColumn(aliasName);

        // todo throw exception if selects or from is missing

        let tableName: string;
        const allSelects: SelectQuery[] = [];
        const excludedSelects: SelectQuery[] = [];

        const aliasName = this.expressionMap.mainAlias.name;

        if (this.expressionMap.mainAlias.hasMetadata) {
            tableName = this.expressionMap.mainAlias.metadata.table.name;

            allSelects.push(...this.buildEscapedEntityColumnSelects(aliasName, this.expressionMap.mainAlias.metadata));
            excludedSelects.push(...this.findEntityColumnSelects(aliasName, this.expressionMap.mainAlias.metadata));

        } else { // if alias does not have metadata - selections will be from custom table
            tableName = this.expressionMap.mainAlias.tableName!;
        }

        // add selects from joins
        this.expressionMap.joinAttributes
            .forEach(join => {
                if (join.metadata) {
                    allSelects.push(...this.buildEscapedEntityColumnSelects(join.alias!, join.metadata));
                    excludedSelects.push(...this.findEntityColumnSelects(join.alias!, join.metadata));
                } else {
                    const hasMainAlias = this.expressionMap.selects.some(select => select.selection === join.alias);
                    if (hasMainAlias) {
                        allSelects.push({ selection: ea(join.alias!) + ".*" });
                        excludedSelects.push({ selection: ea(join.alias!) });
                    }
                }
            });

        if (!this.expressionMap.ignoreParentTablesJoins && this.expressionMap.mainAlias.hasMetadata) {
            if (this.expressionMap.mainAlias!.metadata.parentEntityMetadata && this.expressionMap.mainAlias!.metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + ea(this.expressionMap.mainAlias!.metadata.parentEntityMetadata.table.name);
                this.expressionMap.mainAlias!.metadata.parentEntityMetadata.columns.forEach(column => {
                    // TODO implement partial select
                    allSelects.push({ selection: ea(alias + "." + column.fullName), aliasName: alias + "_" + column.fullName });
                    // allSelects.push(alias + "." + ec(column.fullName) + " AS " + alias + "_" + ea(column.fullName));
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
        switch (this.expressionMap.queryType) {
            case "select":
                const selection = allSelects.map(select => select.selection + (select.aliasName ? " AS " + ea(select.aliasName) : "")).join(", ");
                return "SELECT " + selection + " FROM " + this.escapeTable(tableName) + " " + ea(aliasName) + lock;
            case "delete":
                return "DELETE FROM " + et(tableName);
                // return "DELETE " + (alias ? ea(alias) : "") + " FROM " + this.escapeTable(tableName) + " " + (alias ? ea(alias) : ""); // TODO: only mysql supports aliasing, so what to do with aliases in DELETE queries? right now aliases are used however we are relaying that they will always match a table names
            case "update":
                const updateSet = Object.keys(this.expressionMap.updateSet).map(key => key + "=:updateSet__" + key);
                const params = Object.keys(this.expressionMap.updateSet).reduce((object, key) => {
                    // todo: map propertyNames to names ?
                    object["updateSet_" + key] = this.expressionMap.updateSet![key];
                    return object;
                }, {} as ObjectLiteral);
                this.setParameters(params);
                return "UPDATE " + tableName + " " + (aliasName ? ea(aliasName) : "") + " SET " + updateSet;
        }

        throw new Error("No query builder type is specified.");
    }

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

    protected createWhereExpression() {

        const conditions = this.expressionMap.wheres.map((where, index) => {
            switch (where.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + this.replacePropertyNames(where.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + this.replacePropertyNames(where.condition);
                default:
                    return this.replacePropertyNames(where.condition);
            }
        }).join(" ");

        if (this.expressionMap.mainAlias!.hasMetadata) {
            const mainMetadata = this.expressionMap.mainAlias!.metadata;
            if (mainMetadata.hasDiscriminatorColumn)
                return ` WHERE ${ conditions.length ? "(" + conditions + ") AND" : "" } ${mainMetadata.discriminatorColumn.fullName}=:discriminatorColumnValue`;
        }

        if (!conditions.length) return "";
        return " WHERE " + conditions;
    }

    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    protected replacePropertyNames(statement: string) {
        this.expressionMap.aliases.forEach(alias => {
            if (!alias.hasMetadata) return;
            alias.metadata.embeddeds.forEach(embedded => {
                embedded.columns.forEach(column => {
                    const expression = alias.name + "\\." + embedded.propertyName + "\\." + column.propertyName + "([ =]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), this.escapeAlias(alias.name) + "." + this.escapeColumn(column.fullName) + "$1");
                });
                // todo: what about embedded relations here?
            });
            alias.metadata.columns.filter(column => !column.isInEmbedded).forEach(column => {
                const expression = alias.name + "\\." + column.propertyName + "([ =]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), this.escapeAlias(alias.name) + "." + this.escapeColumn(column.fullName) + "$1");
            });
            alias.metadata.relationsWithJoinColumns/*.filter(relation => !relation.isInEmbedded)*/.forEach(relation => {
                const expression = alias.name + "\\." + relation.propertyName + "([ =]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), this.escapeAlias(alias.name) + "." + this.escapeColumn(relation.name) + "$1");
            });
        });
        return statement;
    }

    protected createJoinExpression(): string {

        // separate escaping functions are used to reduce code size and complexity below
        const et = (aliasName: string) => this.escapeTable(aliasName);
        const ea = (aliasName: string) => this.escapeAlias(aliasName);
        const ec = (aliasName: string) => this.escapeColumn(aliasName);

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
            const destinationTableAlias = joinAttr.alias;
            const appendedCondition = joinAttr.condition ? " AND (" + this.replacePropertyNames(joinAttr.condition) + ")" : "";
            const parentAlias = joinAttr.parentAlias;

            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation)
                return " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) +
                    (joinAttr.condition ? " ON " + this.replacePropertyNames(joinAttr.condition) : "");

            // if real entity relation is involved
            if (relation.isManyToOne || relation.isOneToOneOwner) {
                const destinationTableReferencedColumn = relation.joinColumn.referencedColumn;

                // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                const condition = ea(destinationTableAlias) + "." + ec(destinationTableReferencedColumn.fullName) + "=" + ea(parentAlias) + "." + ec(relation.name);
                return " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) + " ON " + condition + appendedCondition;

            } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                const relationOwnerReferencedColumn = relation.inverseRelation.joinColumn.referencedColumn;

                // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                const condition = ea(destinationTableAlias!) + "." + ec(relation.inverseRelation.name) + "=" + ea(parentAlias) + "." + ec(relationOwnerReferencedColumn.fullName);
                return " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) + " ON " + condition + appendedCondition;

            } else { // means many-to-many
                const junctionTableName = relation.junctionEntityMetadata.table.name;
                const [firstJunctionColumn, secondJunctionColumn] = relation.junctionEntityMetadata.columnsWithoutEmbeddeds;

                const junctionAlias = joinAttr.junctionAlias;
                let junctionCondition = "", destinationCondition = "";
                if (relation.isOwning) {
                    const joinTableColumn = relation.joinTable.referencedColumn.fullName;
                    const inverseJoinColumnName = relation.joinTable.inverseReferencedColumn.fullName;

                    // `post_category`.`postId` = `post`.`id`
                    junctionCondition = ea(junctionAlias) + "." + ec(firstJunctionColumn.fullName) + "=" + ea(parentAlias) + "." + ec(joinTableColumn);

                    // `category`.`id` = `post_category`.`categoryId`
                    destinationCondition = ea(destinationTableAlias) + "." + ec(inverseJoinColumnName) + "=" + ea(junctionAlias) + "." + ec(secondJunctionColumn.fullName);

                } else {
                    const joinTableColumn = relation.inverseRelation.joinTable.inverseReferencedColumn.fullName;
                    const inverseJoinColumnName = relation.inverseRelation.joinTable.referencedColumn.fullName;

                    // `post_category`.`categoryId` = `category`.`id`
                    junctionCondition = ea(junctionAlias) + "." + ec(secondJunctionColumn.fullName) + "=" + ea(parentAlias) + "." + ec(joinTableColumn);

                    // `post`.`id` = `post_category`.`postId`
                    destinationCondition = ea(destinationTableAlias) + "." + ec(inverseJoinColumnName) + "=" + ea(junctionAlias) + "." + ec(firstJunctionColumn.fullName);
                }

                return " " + joinAttr.direction + " JOIN " + et(junctionTableName) + " " + ea(junctionAlias) + " ON " + junctionCondition +
                       " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) + " ON " + destinationCondition + appendedCondition;

            }
        });

        if (!this.expressionMap.ignoreParentTablesJoins && this.expressionMap.mainAlias!.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.parentEntityMetadata && metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + metadata.parentEntityMetadata.table.name;
                const parentJoin = " JOIN " + et(metadata.parentEntityMetadata.table.name) + " " + ea(alias) + " ON " +
                    metadata.parentIdColumns.map(parentIdColumn => {
                        return this.expressionMap.mainAlias!.name + "." + parentIdColumn.fullName + "=" + ea(alias) + "." + parentIdColumn.propertyName;
                    });
                joins.push(parentJoin);
            }
        }

        return joins.join(" ");
    }

    protected createGroupByExpression() {
        if (!this.expressionMap.groupBys || !this.expressionMap.groupBys.length) return "";
        return " GROUP BY " + this.replacePropertyNames(this.expressionMap.groupBys.join(", "));
    }

    protected createOrderByCombinedWithSelectExpression(parentAlias: string) {

        // if table has a default order then apply it
        let orderBys = this.expressionMap.orderBys;
        if (!Object.keys(orderBys).length && this.expressionMap.mainAlias!.hasMetadata) {
            orderBys = this.expressionMap.mainAlias!.metadata.table.orderBy || {};
        }

        const selectString = Object.keys(orderBys)
            .map(columnName => {
                const [alias, column, ...embeddedProperties] = columnName.split(".");
                return this.escapeAlias(parentAlias) + "." + this.escapeColumn(alias + "_" + column + embeddedProperties.join("_"));
            })
            .join(", ");

        const orderByString = Object.keys(orderBys)
            .map(columnName => {
                const [alias, column, ...embeddedProperties] = columnName.split(".");
                return this.escapeAlias(parentAlias) + "." + this.escapeColumn(alias + "_" + column + embeddedProperties.join("_")) + " " + this.expressionMap.orderBys[columnName];
            })
            .join(", ");

        return [selectString, orderByString];
    }

    protected createOrderByExpression() {

        let orderBys = this.expressionMap.orderBys;

        // if table has a default order then apply it
        if (!Object.keys(orderBys).length && this.expressionMap.mainAlias!.hasMetadata) {
            orderBys = this.expressionMap.mainAlias!.metadata.table.orderBy || {};
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

    protected createLimitExpression(): string {
        if (!this.expressionMap.limit) return "";
        return " LIMIT " + this.expressionMap.limit;
    }

    protected createOffsetExpression(): string {
        if (!this.expressionMap.offset) return "";
        return " OFFSET " + this.expressionMap.offset;
    }

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
     * Creates "WHERE" expression and variables for the given "ids".
     */
    protected createWhereIdsExpression(ids: any[]): [string, ObjectLiteral] {
        const metadata = this.expressionMap.mainAlias!.metadata;

        // create shortcuts for better readability
        const ea = (aliasName: string) => this.escapeAlias(aliasName);
        const ec = (columnName: string) => this.escapeColumn(columnName);

        const alias = this.expressionMap.mainAlias!.name;
        const parameters: ObjectLiteral = {};
        const whereStrings = ids.map((id, index) => {
            const whereSubStrings: string[] = [];
            if (metadata.hasMultiplePrimaryKeys) {
                metadata.primaryColumns.forEach((primaryColumn, secondIndex) => {
                    whereSubStrings.push(ea(alias) + "." + ec(primaryColumn.fullName) + "=:id_" + index + "_" + secondIndex);
                    parameters["id_" + index + "_" + secondIndex] = id[primaryColumn.fullName];
                });
                metadata.parentIdColumns.forEach((primaryColumn, secondIndex) => {
                    whereSubStrings.push(ea(alias) + "." + ec(id[primaryColumn.fullName]) + "=:parentId_" + index + "_" + secondIndex);
                    parameters["parentId_" + index + "_" + secondIndex] = id[primaryColumn.propertyName];
                });
            } else {
                if (metadata.primaryColumns.length > 0) {
                    whereSubStrings.push(ea(alias) + "." + ec(metadata.firstPrimaryColumn.fullName) + "=:id_" + index);
                    parameters["id_" + index] = id;

                } else if (metadata.parentIdColumns.length > 0) {
                    whereSubStrings.push(ea(alias) + "." + ec(metadata.parentIdColumns[0].fullName) + "=:parentId_" + index);
                    parameters["parentId_" + index] = id;
                }
            }
            return whereSubStrings.join(" AND ");
        });

        const whereString = whereStrings.length > 1 ? "(" + whereStrings.join(" OR ") + ")" : whereStrings[0];
        return [whereString, parameters];
    }

    protected async getQueryRunner(): Promise<QueryRunner> {

        if (this.queryRunnerProvider instanceof QueryRunnerProvider) {
            return this.queryRunnerProvider.provide();

        } else { // means its empty
            return this.connection.driver.createQueryRunner();
        }
    }

    protected hasOwnQueryRunner(): boolean {
        return !this.queryRunnerProvider;
    }

}
