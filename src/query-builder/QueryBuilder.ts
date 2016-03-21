import {Alias} from "./alias/Alias";
import {AliasMap} from "./alias/AliasMap";
import {Connection} from "../connection/Connection";
import {RawSqlResultsToEntityTransformer} from "./transformer/RawSqlResultsToEntityTransformer";
import {OrmBroadcaster} from "../subscriber/OrmBroadcaster";

export interface Join {
    alias: Alias;
    type: "left"|"inner";
    conditionType: "on"|"with";
    condition: string;
}

export class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    private broadcaster: OrmBroadcaster;
    private _aliasMap: AliasMap;
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

    constructor(private connection: Connection) {
        this._aliasMap = new AliasMap(connection.metadatas);
        this.broadcaster = new OrmBroadcaster(connection);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get aliasMap() {
        return this._aliasMap;
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
            this._aliasMap.addMainAlias(aliasObj);
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
    update(tableNameOrEntityOrUpdateSet?: string|Function, updateSet?: Object): this {
        if (tableNameOrEntityOrUpdateSet instanceof Function) {
            const aliasName = (<any> tableNameOrEntityOrUpdateSet).name;
            const aliasObj = new Alias(aliasName);
            aliasObj.target = <Function> tableNameOrEntityOrUpdateSet;
            this._aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
            
        } else if (typeof tableNameOrEntityOrUpdateSet === "object") {
            updateSet = <Object> tableNameOrEntityOrUpdateSet;
            
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
    from(entity: Function, alias?: string): this;
    from(entityOrTableName: Function|string, alias: string): this {
        if (entityOrTableName instanceof Function) {
            const aliasObj = new Alias(alias);
            aliasObj.target = <Function> entityOrTableName;
            this._aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
        } else {
            this.fromTableName = <string> entityOrTableName;
            this.fromTableAlias = alias;
        }
        return this;
    }

    innerJoinAndSelect(property: string, alias: string, conditionType?: "on"|"with", condition?: string): this;
    innerJoinAndSelect(entity: Function, alias: string, conditionType?: "on"|"with", condition?: string): this;
    innerJoinAndSelect(entityOrProperty: Function|string, alias: string, conditionType?: "on"|"with", condition?: string): this {
        this.addSelect(alias);
        return this.join("inner", entityOrProperty, alias, conditionType, condition);
    }

    innerJoin(property: string, alias: string, conditionType?: "on"|"with", condition?: string): this;
    innerJoin(entity: Function, alias: string, conditionType?: "on"|"with", condition?: string): this;
    innerJoin(entityOrProperty: Function|string, alias: string, conditionType?: "on"|"with", condition?: string): this {
        return this.join("inner", entityOrProperty, alias, conditionType, condition);
    }

    leftJoinAndSelect(property: string, alias: string, conditionType?: "on"|"with", condition?: string): this;
    leftJoinAndSelect(entity: Function, alias: string, conditionType?: "on"|"with", condition?: string): this;
    leftJoinAndSelect(entityOrProperty: Function|string, alias: string, conditionType: "on"|"with" = "on", condition?: string): this {
        this.addSelect(alias);
        return this.join("left", entityOrProperty, alias, conditionType, condition);
    }

    leftJoin(property: string, alias: string, conditionType?: "on"|"with", condition?: string): this;
    leftJoin(entity: Function, alias: string, conditionType?: "on"|"with", condition?: string): this;
    leftJoin(entityOrProperty: Function|string, alias: string, conditionType: "on"|"with" = "on", condition?: string): this {
        return this.join("left", entityOrProperty, alias, conditionType, condition);
    }

    join(joinType: "inner"|"left", property: string, alias: string, conditionType?: "on"|"with", condition?: string): this;
    join(joinType: "inner"|"left", entity: Function, alias: string, conditionType?: "on"|"with", condition?: string): this;
    join(joinType: "inner"|"left", entityOrProperty: Function|string, alias: string, conditionType: "on"|"with", condition: string): this;
    join(joinType: "inner"|"left", entityOrProperty: Function|string, alias: string, conditionType: "on"|"with" = "on", condition?: string): this {

        const aliasObj = new Alias(alias);
        this._aliasMap.addAlias(aliasObj);
        if (entityOrProperty instanceof Function) {
            aliasObj.target = entityOrProperty;

        } else if (typeof entityOrProperty === "string") {
            aliasObj.parentAliasName = entityOrProperty.split(".")[0];
            aliasObj.parentPropertyName = entityOrProperty.split(".")[1];
        }

        const join: Join = { type: joinType, alias: aliasObj, conditionType: conditionType, condition: condition };
        this.joins.push(join);
        return this;
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

    having(having: string): this {
        this.havings.push({ type: "simple", condition: having });
        return this;
    }

    andHaving(having: string): this {
        this.havings.push({ type: "and", condition: having });
        return this;
    }

    orHaving(having: string): this {
        this.havings.push({ type: "or", condition: having });
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
        this.parameters = parameters;
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
        return this.connection.driver.query(this.getSql());
    }
    
    getScalarResults<T>(): Promise<T[]> {
        return this.connection.driver.query<T[]>(this.getSql());
    }

    getSingleScalarResult<T>(): Promise<T> {
        return this.getScalarResults().then(results => results[0]);
    }

    getResults(): Promise<Entity[]> {
        const mainAlias = this.aliasMap.mainAlias.name;
        if (this.firstResult || this.maxResults) {
            const metadata = this.connection.getMetadata(this.fromEntity.alias.target);
            const idsQuery = this.clone()
                .select(`DISTINCT(${mainAlias}.${metadata.primaryColumn.name}) as ids`)
                .setOffset(this.firstResult)
                .setLimit(this.maxResults)
                .getSql();
            return this.connection.driver
                .query<any[]>(idsQuery)
                .then((results: any[]) => {
                    const ids = results.map(result => result["ids"]).join(", ");
                    const queryWithIds = this.clone()
                        .andWhere(mainAlias + "." + metadata.primaryColumn.name + " IN (" + ids + ")")
                        .getSql();
                    return this.connection.driver.query<any[]>(queryWithIds);
                })
                .then(results => this.rawResultsToEntities(results))
                .then(results => {
                    this.broadcaster.broadcastLoadEventsForAll(results);
                    return results;
                });

        } else {
            return this.connection.driver
                .query<any[]>(this.getSql())
                .then(results => this.rawResultsToEntities(results))
                .then(results => {
                    this.broadcaster.broadcastLoadEventsForAll(results);
                    return results;
                });
        }
    }

    getSingleResult(): Promise<Entity> {
        return this.getResults().then(entities => entities[0]);
    }

    getCount(): Promise<number> {
        const mainAlias = this.aliasMap.mainAlias.name;
        const metadata = this.connection.getMetadata(this.fromEntity.alias.target);
        const countQuery = this.clone()
            .select(`COUNT(DISTINCT(${mainAlias}.${metadata.primaryColumn.name})) as cnt`)
            .getSql();
        return this.connection.driver
            .query<any[]>(countQuery)
            .then(results => parseInt(results[0]["cnt"]));
    }

    clone() {
        const qb = new QueryBuilder(this.connection);
        
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
            const property = join.alias.target || (join.alias.parentAliasName + "." + join.alias.parentPropertyName);
            qb.join(join.type, property, join.alias.name, join.conditionType, join.condition);
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

        this.orderBys.forEach(orderBy => qb.addOrderBy(orderBy.sort, orderBy.order));
        Object.keys(this.parameters).forEach(key => qb.setParameter(key, this.parameters[key]))

        qb.setLimit(this.limit)
            .setOffset(this.offset)
            .setFirstResult(this.firstResult)
            .setMaxResults(this.maxResults);

        return qb;
    }


    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected rawResultsToEntities(results: any[]) {
        const transformer = new RawSqlResultsToEntityTransformer(this._aliasMap);
        return transformer.transform(results);
    }
    
    protected createSelectExpression() {
        // todo throw exception if selects or from is missing

        let alias: string, tableName: string;
        const allSelects: string[] = [];
        
        if (this.fromEntity) {
            const metadata = this._aliasMap.getEntityMetadataByAlias(this.fromEntity.alias);
            tableName = metadata.table.name;
            alias = this.fromEntity.alias.name;

            // add select from the main table
            if (this.selects.indexOf(alias) !== -1) {
                metadata.columns.forEach(column => {
                    allSelects.push(alias + "." + column.name + " AS " + alias + "_" + column.name);
                });
            }
            
        } else if (this.fromTableName) {
            tableName = this.fromTableName;
            
        } else {
            throw new Error("No from given");
        }

        // add selects from joins
        this.joins
            .filter(join => this.selects.indexOf(join.alias.name) !== -1)
            .forEach(join => {
                const joinMetadata = this._aliasMap.getEntityMetadataByAlias(join.alias);
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
            const joinType = join.type === "inner" ? "INNER" : "LEFT";
            const appendedCondition = join.condition ? " AND " + join.condition : ""; 
            const parentAlias = join.alias.parentAliasName;
            const parentMetadata = this._aliasMap.getEntityMetadataByAlias(this._aliasMap.findAliasByName(parentAlias));
            const parentTable = parentMetadata.table.name;
            const parentTableColumn = parentMetadata.primaryColumn.name;
            const relation = parentMetadata.findRelationWithDbName(join.alias.parentPropertyName);
            const junctionMetadata = relation.junctionEntityMetadata;
            const joinMetadata = this._aliasMap.getEntityMetadataByAlias(join.alias);
            const joinTable = joinMetadata.table.name;
            const joinTableColumn = joinMetadata.primaryColumn.name;
            
            if (relation.isManyToMany) {
                const junctionTable = junctionMetadata.table.name;
                const junctionAlias = join.alias.parentAliasName + "_" + join.alias.name;
                const joinAlias = join.alias.name;
                const condition1 = junctionAlias + "." + junctionMetadata.columns[0].name + "=" + parentAlias + "." + joinTableColumn; // todo: use column names from junction table somehow
                const condition2 = joinAlias + "." + joinTableColumn + "=" + junctionAlias + "." + junctionMetadata.columns[1].name;
                
                return " " + joinType + " JOIN " + junctionTable + " " + junctionAlias + " " + join.conditionType + " " + condition1 +
                       " " + joinType + " JOIN " + joinTable + " " + joinAlias + " " + join.conditionType + " " + condition2 + appendedCondition;
                
            } else if (relation.isManyToOne || (relation.isOneToOne && relation.isOwning)) {
                const condition = join.alias.name + "." + joinTableColumn + "=" + parentAlias + "." + join.alias.parentPropertyName;
                return " " + joinType + " JOIN " + joinTable + " " + join.alias.name + " " + join.conditionType + " " + condition + appendedCondition;

            } else if (relation.isOneToMany || (relation.isOneToOne && !relation.isOwning)) {
                const condition = join.alias.name + "." + relation.inverseSideProperty + "=" + parentAlias + "." + joinTableColumn;
                return " " + joinType + " JOIN " + joinTable + " " + join.alias.name + " " + join.conditionType + " " + condition + appendedCondition;
       
            } else {
                return " " + joinType + " JOIN " + joinTable + " " + join.alias.name + " " + join.conditionType + " " + join.condition;
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
        // todo: proper escape values and prevent sql injection
        Object.keys(this.parameters).forEach(key => {
            const value = this.parameters[key] !== null && this.parameters[key] !== undefined ? "\"" + this.parameters[key] + "\"" : "NULL";
            sql = sql.replace(":" + key, value); // .replace('"', '')
        });
        return sql;
    }

}
