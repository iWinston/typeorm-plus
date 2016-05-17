import {Alias} from "./alias/Alias";
import {AliasMap} from "./alias/AliasMap";
import {RawSqlResultsToEntityTransformer} from "./transformer/RawSqlResultsToEntityTransformer";
import {Broadcaster} from "../subscriber/Broadcaster";
import {EntityMetadataCollection} from "../metadata/collection/EntityMetadataCollection";
import {Driver} from "../driver/Driver";

/**
 * @internal
 */
export interface Join {
    alias: Alias;
    type: "LEFT"|"INNER";
    conditionType: "ON"|"WITH";
    condition: string;
    tableName: string;
    mapToProperty: string|undefined;
    isMappingMany: boolean;
}

/**
 * @internal
 */
export interface JoinMapping {
    alias: Alias;
    parentName: string;
    propertyName: string;
    isMany: boolean;
}

export class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    private aliasMap: AliasMap;
    private type: "select"|"update"|"delete";
    private selects: string[] = [];
    private fromEntity: { alias: Alias };
    private fromTableName: string;
    private fromTableAlias: string;
    private updateQuerySet: Object;
    private joins: Join[] = [];
    private groupBys: string[] = [];
    private wheres: { type: "simple"|"and"|"or", condition: string }[] = [];
    private havings: { type: "simple"|"and"|"or", condition: string }[] = [];
    private orderBys: { sort: string, order: "ASC"|"DESC" }[] = [];
    private parameters: { [key: string]: any } = {};
    private limit: number;
    private offset: number;
    private firstResult: number;
    private maxResults: number;
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private driver: Driver,
                private entityMetadatas: EntityMetadataCollection, 
                private broadcaster: Broadcaster) {
        this.aliasMap = new AliasMap(entityMetadatas);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get alias(): string {
        return this.aliasMap.mainAlias.name;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    delete(entity?: Function): this;
    delete(tableName?: string): this;
    delete(tableNameOrEntity?: string|Function): this {
        if (tableNameOrEntity instanceof Function) {
            const aliasName = (<any> tableNameOrEntity).name;
            const aliasObj = new Alias(aliasName);
            aliasObj.target = <Function> tableNameOrEntity;
            this.aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
        } else if (typeof tableNameOrEntity === "string") {
            this.fromTableName = <string> tableNameOrEntity;
        }

        this.type = "delete";
        return this;
    }

    update(updateSet: Object): this;
    update(entity: Function, updateSet: Object): this;
    update(tableName: string, updateSet: Object): this;
    update(tableNameOrEntityOrUpdateSet?: string|Function|Object, maybeUpdateSet?: Object): this {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : <Object> tableNameOrEntityOrUpdateSet;
        
        if (tableNameOrEntityOrUpdateSet instanceof Function) {
            const aliasName = (<any> tableNameOrEntityOrUpdateSet).name;
            const aliasObj = new Alias(aliasName);
            aliasObj.target = <Function> tableNameOrEntityOrUpdateSet;
            this.aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
            
        } else if (typeof tableNameOrEntityOrUpdateSet === "string") {
            this.fromTableName = <string> tableNameOrEntityOrUpdateSet;
        }
        
        this.type = "update";
        this.updateQuerySet = updateSet;
        return this;
    }

    select(selection?: string): this;
    select(selection?: string[]): this;
    select(...selection: string[]): this;
    select(selection?: string|string[]): this {
        this.type = "select";
        if (selection) {
            if (selection instanceof Array) {
                this.selects = selection;
            } else {
                this.selects = [selection];
            }
        }
        return this;
    }

    addSelect(selection: string): this;
    addSelect(selection: string[]): this;
    addSelect(...selection: string[]): this;
    addSelect(selection: string|string[]): this {
        if (selection instanceof Array)
            this.selects = this.selects.concat(selection);
        else
            this.selects.push(selection);

        return this;
    }

    from(tableName: string, alias: string): this;
    from(entity: Function, alias: string): this;
    from(entityOrTableName: Function|string, alias: string): this {
        if (entityOrTableName instanceof Function) {
            const aliasObj = new Alias(alias);
            aliasObj.target = <Function> entityOrTableName;
            this.aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
        } else {
            this.fromTableName = <string> entityOrTableName;
            this.fromTableAlias = alias;
        }
        return this;
    }

    innerJoinAndMapMany(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoinAndMapMany(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        this.addSelect(alias);
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, true);
    }

    innerJoinAndMapOne(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoinAndMapOne(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        this.addSelect(alias);
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, false);
    }

    innerJoinAndSelect(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoinAndSelect(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoinAndSelect(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        this.addSelect(alias);
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters);
    }

    innerJoin(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoin(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    innerJoin(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters);
    }

    leftJoinAndMapMany(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoinAndMapMany(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        this.addSelect(alias);
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, true);
    }

    leftJoinAndMapOne(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoinAndMapOne(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        this.addSelect(alias);
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, false);
    }

    leftJoinAndSelect(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoinAndSelect(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoinAndSelect(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        this.addSelect(alias);
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters);
    }

    leftJoin(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoin(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }): this;
    leftJoin(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }): this {
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters);
    }

    where(where: string, parameters?: { [key: string]: any }): this {
        this.wheres.push({ type: "simple", condition: where });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    andWhere(where: string, parameters?: { [key: string]: any }): this {
        this.wheres.push({ type: "and", condition: where });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    orWhere(where: string, parameters?: { [key: string]: any }): this {
        this.wheres.push({ type: "or", condition: where });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    groupBy(groupBy: string): this {
        this.groupBys = [groupBy];
        return this;
    }

    addGroupBy(groupBy: string): this {
        this.groupBys.push(groupBy);
        return this;
    }

    having(having: string, parameters?: { [key: string]: any }): this {
        this.havings.push({ type: "simple", condition: having });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    andHaving(having: string, parameters?: { [key: string]: any }): this {
        this.havings.push({ type: "and", condition: having });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    orHaving(having: string, parameters?: { [key: string]: any }): this {
        this.havings.push({ type: "or", condition: having });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    orderBy(sort: string, order: "ASC"|"DESC" = "ASC"): this {
        this.orderBys = [{ sort: sort, order: order }];
        return this;
    }

    addOrderBy(sort: string, order: "ASC"|"DESC" = "ASC"): this {
        this.orderBys.push({ sort: sort, order: order });
        return this;
    }

    setLimit(limit: number): this {
        this.limit = limit;
        return this;
    }

    setOffset(offset: number): this {
        this.offset = offset;
        return this;
    }

    setFirstResult(firstResult: number): this {
        this.firstResult = firstResult;
        return this;
    }

    setMaxResults(maxResults: number): this {
        this.maxResults = maxResults;
        return this;
    }

    setParameter(key: string, value: any): this {
        this.parameters[key] = value;
        return this;
    }

    setParameters(parameters: { [key: string]: any }): this {
        this.parameters = {};
        Object.keys(parameters).forEach(key => this.parameters[key] = parameters[key]);
        return this;
    }

    addParameters(parameters: { [key: string]: any }): this {
        Object.keys(parameters).forEach(key => this.parameters[key] = parameters[key]);
        return this;
    }

    getSql(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        sql  = this.replaceParameters(sql);
        return sql;
    }
    
    execute(): Promise<any> {
        return this.driver.query(this.getSql());
    }
    
    getScalarResults<T>(): Promise<T[]> {
        return this.driver.query<T[]>(this.getSql());
    }

    getSingleScalarResult<T>(): Promise<T> {
        return this.getScalarResults().then(results => results[0]);

    }

    getResults(): Promise<Entity[]> {
        return this.getResultsAndScalarResults().then(results => {
            return results.entities;
        });
    }

    getResultsAndScalarResults(): Promise<{ entities: Entity[], scalarResults: any[] }> {
        const mainAlias = this.aliasMap.mainAlias.name;
        let scalarResults: any[];
        if (this.firstResult || this.maxResults) {
            const metadata = this.entityMetadatas.findByTarget(this.fromEntity.alias.target);
            let idsQuery = `SELECT DISTINCT(distinctAlias.${mainAlias}_${metadata.primaryColumn.name}) as ids`;
            if (this.orderBys && this.orderBys.length > 0)
                idsQuery += ", " + this.orderBys.map(orderBy => orderBy.sort.replace(".", "_")).join(", ");
            idsQuery += ` FROM (${this.getSql()}) distinctAlias`;
            if (this.orderBys && this.orderBys.length > 0)
                idsQuery += " ORDER BY " + this.orderBys.map(order => "distinctAlias." + order.sort.replace(".", "_") + " " + order.order).join(", ");
            if (this.maxResults)
                idsQuery += " LIMIT " + this.maxResults;
            if (this.firstResult)
                idsQuery += " OFFSET " + this.firstResult;
            return this.driver
                .query<any[]>(idsQuery)
                .then((results: any[]) => {
                    scalarResults = results;
                    const ids = results.map(result => result["ids"]).join(", ");
                    if (ids.length === 0)
                        return Promise.resolve([]);
                    const queryWithIds = this.clone()
                        .andWhere(mainAlias + "." + metadata.primaryColumn.name + " IN (" + ids + ")")
                        .getSql();
                    return this.driver.query<any[]>(queryWithIds);
                })
                .then(results => this.rawResultsToEntities(results))
                .then(results => this.addLazyProperties(results))
                .then(results => this.broadcaster.broadcastLoadEventsForAll(results).then(() => results))
                .then(results => {
                    return {
                        entities: results,
                        scalarResults: scalarResults
                    };
                });

        } else {
            return this.driver
                .query<any[]>(this.getSql())
                .then(results => {
                    scalarResults = results;
                    return this.rawResultsToEntities(results);
                })
                .then(results => this.addLazyProperties(results))
                .then(results => {
                    return this.broadcaster
                        .broadcastLoadEventsForAll(results)
                        .then(() => results);
                })
                .then(results => {
                    return {
                        entities: results,
                        scalarResults: scalarResults
                    };
                });
        }
    }

    getSingleResult(): Promise<Entity> {
        return this.getResults().then(entities => entities[0]);
    }

    getCount(): Promise<number> {
        const mainAlias = this.aliasMap.mainAlias.name;
        const metadata = this.entityMetadatas.findByTarget(this.fromEntity.alias.target);
        const countQuery = this.clone({ skipOrderBys: true })
            .select(`COUNT(DISTINCT(${mainAlias}.${metadata.primaryColumn.name})) as cnt`)
            .getSql();
        return this.driver
            .query<any[]>(countQuery)
            .then(results => {
                if (!results || !results[0] || !results[0]["cnt"])
                    return 0;

                return parseInt(results[0]["cnt"]);
            });
    }

    getResultsAndCount(): Promise<[Entity[], number]> {
        return Promise.all<any>([
            this.getResults(),
            this.getCount()
        ]);
    }

    clone(options?: { skipOrderBys?: boolean, skipLimit?: boolean, skipOffset?: boolean }) {
        const qb = new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster);
        
        switch (this.type) {
            case "select":
                qb.select(this.selects);
                break;
            case "update":
                qb.update(this.updateQuerySet);
                break;
            case "delete":
                qb.delete();
                break;
        }

        if (this.fromEntity && this.fromEntity.alias && this.fromEntity.alias.target) {
            qb.from(this.fromEntity.alias.target, this.fromEntity.alias.name);
        } else if (this.fromTableName) {
            qb.from(this.fromTableName, this.fromTableAlias);
        }

        this.joins.forEach(join => {
            const property = join.tableName || join.alias.target || (join.alias.parentAliasName + "." + join.alias.parentPropertyName);
            qb.join(join.type, property, join.alias.name, join.conditionType, join.condition, undefined, join.mapToProperty, join.isMappingMany);
        });

        this.groupBys.forEach(groupBy => qb.addGroupBy(groupBy));

        this.wheres.forEach(where => {
            switch (where.type) {
                case "simple":
                    qb.where(where.condition);
                    break;
                case "and":
                    qb.andWhere(where.condition);
                    break;
                case "or":
                    qb.orWhere(where.condition);
                    break;
            }
        });

        this.havings.forEach(having => {
            switch (having.type) {
                case "simple":
                    qb.where(having.condition);
                    break;
                case "and":
                    qb.andWhere(having.condition);
                    break;
                case "or":
                    qb.orWhere(having.condition);
                    break;
            }
        });

        if (!options || !options.skipOrderBys)
            this.orderBys.forEach(orderBy => qb.addOrderBy(orderBy.sort, orderBy.order));
        
        Object.keys(this.parameters).forEach(key => qb.setParameter(key, this.parameters[key]));

        if (!options || !options.skipLimit)
            qb.setLimit(this.limit);

        if (!options || !options.skipOffset)
            qb.setOffset(this.offset);

        qb.setFirstResult(this.firstResult)
            .setMaxResults(this.maxResults);

        return qb;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected rawResultsToEntities(results: any[]) {
        const transformer = new RawSqlResultsToEntityTransformer(this.driver, this.aliasMap, this.extractJoinMappings());
        return transformer.transform(results);
    }

    protected addLazyProperties(entities: any[]) {
        entities.forEach(entity => {
            const metadata = this.entityMetadatas.findByTarget(entity.constructor);
            metadata.relations
                .filter(relation => relation.isLazy)
                .forEach(relation => {
                    const index = "__" + relation.propertyName + "__";

                    Object.defineProperty(entity, relation.propertyName, {
                        get: () => {
                            if (entity[index])
                                return Promise.resolve(entity[index]);
                            // find object metadata and try to load
                            return new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster)
                                .select(relation.propertyName)
                                .from(relation.target, relation.propertyName) // todo: change `id` after join column implemented
                                .where(relation.propertyName + ".id=:" + relation.propertyName + "Id")
                                .setParameter(relation.propertyName + "Id", entity[index])
                                .getSingleResult()
                                .then(result => {
                                    entity[index] = result;
                                    return entity[index];
                                });
                        },
                        set: (promise: Promise<any>) => {
                            if (promise instanceof Promise) {
                                promise.then(result => entity[index] = result);
                            } else {
                                entity[index] = promise;
                            }
                        }
                    });
                });
        });
        return entities;
    }
    
    protected createSelectExpression() {
        // todo throw exception if selects or from is missing

        let alias: string = "", tableName: string;
        const allSelects: string[] = [];

        if (this.fromTableName) {
            tableName = this.fromTableName;
            alias = this.fromTableAlias;

        } else if (this.fromEntity) {
            const metadata = this.aliasMap.getEntityMetadataByAlias(this.fromEntity.alias);
            tableName = metadata.table.name;
            alias = this.fromEntity.alias.name;

            // add select from the main table
            if (this.selects.indexOf(alias) !== -1) {
                metadata.columns.forEach(column => {
                    allSelects.push(alias + "." + column.name + " AS " + alias + "_" + column.name);
                });
            }

        } else {
            throw new Error("No from given");
        }

        // add selects from joins
        this.joins
            .filter(join => this.selects.indexOf(join.alias.name) !== -1)
            .forEach(join => {
                const joinMetadata = this.aliasMap.getEntityMetadataByAlias(join.alias);
                joinMetadata.columns.forEach(column => {
                    allSelects.push(join.alias.name + "." + column.name + " AS " + join.alias.name + "_" + column.propertyName);
                });
            });
        
        // add all other selects
        this.selects.filter(select => {
            return select !== alias && !this.joins.find(join => join.alias.name === select);
        }).forEach(select => allSelects.push(select));
        
        // if still selection is empty, then simply set it to all (*)
        if (allSelects.length === 0)
            allSelects.push("*");
        
        // create a selection query
        switch (this.type) {
            case "select":
                return "SELECT " + allSelects.join(", ") + " FROM " + tableName + " " + alias;
            case "delete":
                return "DELETE FROM " + tableName + " " + (alias ? alias : "");
            case "update":
                const updateSet = Object.keys(this.updateQuerySet).map(key => key + "=:updateQuerySet_" + key);
                const params = Object.keys(this.updateQuerySet).reduce((object, key) => {
                    (<any> object)["updateQuerySet_" + key] = (<any> this.updateQuerySet)[key];
                    return object;
                }, {});
                this.addParameters(params);
                return "UPDATE " + tableName + " " + (alias ? alias : "") + " SET " + updateSet;
        }
        
        throw new Error("No query builder type is specified.");
    }

    protected createWhereExpression() {
        if (!this.wheres || !this.wheres.length) return "";

        return " WHERE " + this.wheres.map((where, index) => {
            switch (where.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + where.condition;
                case "or":
                    return (index > 0 ? "OR " : "") + where.condition;
                default:
                    return where.condition;
            }
        }).join(" ");
    }

    protected createJoinExpression() {
        return this.joins.map(join => {
            const joinType = join.type; // === "INNER" ? "INNER" : "LEFT";
            const joinTableName = join.tableName ? join.tableName : this.aliasMap.getEntityMetadataByAlias(join.alias).table.name;
            const parentAlias = join.alias.parentAliasName;
            if (!parentAlias) {
                return " " + joinType + " JOIN " + joinTableName + " " + join.alias.name + " " + join.conditionType + " " + join.condition;
            }
            
            const parentMetadata = this.aliasMap.getEntityMetadataByAlias(this.aliasMap.findAliasByName(parentAlias));
            const relation = parentMetadata.findRelationWithDbName(join.alias.parentPropertyName);
            const junctionMetadata = relation.junctionEntityMetadata;
            const appendedCondition = join.condition ? " AND " + join.condition : "";
            
            if (relation.isManyToMany) {
                const junctionTable = junctionMetadata.table.name;
                const junctionAlias = join.alias.parentAliasName + "_" + join.alias.name;
                const joinAlias = join.alias.name;
                const joinTable = relation.isOwning ? relation.joinTable : relation.inverseRelation.joinTable; // not sure if this is correct
                const joinTableColumn = joinTable.referencedColumn.name; // not sure if this is correct
                const inverseJoinColumnName = joinTable.inverseReferencedColumn.name; // not sure if this is correct

                let condition1 = "", condition2 = "";
                if (relation.isOwning) {
                    condition1 = junctionAlias + "." + junctionMetadata.columns[0].name + "=" + parentAlias + "." + joinTableColumn;
                    condition2 = joinAlias + "." + inverseJoinColumnName + "=" + junctionAlias + "." + junctionMetadata.columns[1].name;
                } else {
                    condition1 = junctionAlias + "." + junctionMetadata.columns[1].name + "=" + parentAlias + "." + joinTableColumn;
                    condition2 = joinAlias + "." + inverseJoinColumnName + "=" + junctionAlias + "." + junctionMetadata.columns[0].name;
                }

                return " " + joinType + " JOIN " + junctionTable + " " + junctionAlias + " " + join.conditionType + " " + condition1 +
                       " " + joinType + " JOIN " + joinTableName + " " + joinAlias + " " + join.conditionType + " " + condition2 + appendedCondition;
                
            } else if (relation.isManyToOne || (relation.isOneToOne && relation.isOwning)) {
                const joinTableColumn = relation.joinColumn.referencedColumn.name;
                const condition = join.alias.name + "." + joinTableColumn + "=" + parentAlias + "." + join.alias.parentPropertyName;
                return " " + joinType + " JOIN " + joinTableName + " " + join.alias.name + " " + join.conditionType + " " + condition + appendedCondition;

            } else if (relation.isOneToMany || (relation.isOneToOne && !relation.isOwning)) {
                const joinTableColumn = relation.inverseRelation.joinColumn.referencedColumn.name;
                const condition = join.alias.name + "." + relation.inverseSideProperty + "=" + parentAlias + "." + joinTableColumn;
                return " " + joinType + " JOIN " + joinTableName + " " + join.alias.name + " " + join.conditionType + " " + condition + appendedCondition;
       
            } else {
                throw new Error("Unexpected relation type"); // this should not be possible
            }
        }).join(" ");
    }

    protected createGroupByExpression() {
        if (!this.groupBys || !this.groupBys.length) return "";
        return " GROUP BY " + this.groupBys.join(", ");
    }

    protected createHavingExpression() {
        if (!this.havings || !this.havings.length) return "";
        return " HAVING " + this.havings.map(having => {
                switch (having.type) {
                    case "and":
                        return " AND " + having.condition;
                    case "or":
                        return " OR " + having.condition;
                    default:
                        return " " + having.condition;
                }
            }).join(" ");
    }

    protected createOrderByExpression() {
        if (!this.orderBys || !this.orderBys.length) return "";
        return " ORDER BY " + this.orderBys.map(order => order.sort + " " + order.order).join(", ");
    }

    protected createLimitExpression() {
        if (!this.limit) return "";
        return " LIMIT " + this.limit;
    }

    protected createOffsetExpression() {
        if (!this.offset) return "";
        return " OFFSET " + this.offset;
    }

    protected replaceParameters(sql: string) {
        Object.keys(this.parameters).forEach(key => {
            const value = this.parameters[key] !== null && this.parameters[key] !== undefined ? this.driver.escape(this.parameters[key]) : "NULL";
            sql = sql.replace(new RegExp(":" + key, "g"), value); // todo: make replace only in value statements, otherwise problems
        });
        return sql;
    }

    protected extractJoinMappings(): JoinMapping[] {
        return this.joins
            .filter(join => !!join.mapToProperty)
            .map(join => {
                const [parentName, propertyName] = (join.mapToProperty as string).split(".");
                return {
                    alias: join.alias,
                    parentName: parentName,
                    propertyName: propertyName,
                    isMany: join.isMappingMany
                } as JoinMapping;
            });
    }

    protected join(joinType: "INNER"|"LEFT", property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }, mapToProperty?: string, isMappingMany?: boolean): this;
    protected join(joinType: "INNER"|"LEFT", entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: { [key: string]: any }, mapToProperty?: string, isMappingMany?: boolean): this;
    protected join(joinType: "INNER"|"LEFT", entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH", condition: string, parameters?: { [key: string]: any }, mapToProperty?: string, isMappingMany?: boolean): this;
    protected join(joinType: "INNER"|"LEFT", entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: { [key: string]: any }, mapToProperty?: string, isMappingMany: boolean = false): this {

        if (!mapToProperty && typeof entityOrProperty === "string")
            mapToProperty = entityOrProperty;

        let tableName = "";
        const aliasObj = new Alias(alias);
        this.aliasMap.addAlias(aliasObj);
        if (entityOrProperty instanceof Function) {
            aliasObj.target = entityOrProperty;

        } else if (typeof entityOrProperty === "string" && entityOrProperty.indexOf(".") !== -1) {
            aliasObj.parentAliasName = entityOrProperty.split(".")[0];
            aliasObj.parentPropertyName = entityOrProperty.split(".")[1];
        } else if (typeof entityOrProperty === "string") {
            tableName = entityOrProperty;
        }

        const join: Join = { type: joinType, alias: aliasObj, tableName: tableName, conditionType: conditionType, condition: condition, mapToProperty: mapToProperty, isMappingMany: isMappingMany };
        this.joins.push(join);
        if (parameters) this.addParameters(parameters);
        return this;
    }

}
