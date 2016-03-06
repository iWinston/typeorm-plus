import {Alias} from "./alias/Alias";
import {AliasMap} from "./alias/AliasMap";
import {Connection} from "../connection/Connection";
import {RawSqlResultsToEntityTransformer} from "./transformer/RawSqlResultsToEntityTransformer";

export interface Join {
    alias: Alias;
    type: "left"|"inner";
    conditionType: "on"|"with";
    condition: string;
}

export class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Pirvate properties
    // -------------------------------------------------------------------------

    private _aliasMap: AliasMap;
    private type: "select"|"update"|"delete";
    private selects: string[] = [];
    private froms: { alias: Alias };
    private joins: Join[] = [];
    private groupBys: string[] = [];
    private wheres: { type: "simple"|"and"|"or", condition: string }[] = [];
    private havings: { type: "simple"|"and"|"or", condition: string }[] = [];
    private orderBys: { sort: string, order: "ASC"|"DESC" }[] = [];
    private parameters: { [key: string]: string } = {};
    private limit: number;
    private offset: number;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
        this._aliasMap = new AliasMap(connection.metadatas);
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

    delete(): this {
        this.type = "delete";
        return this;
    }

    update(): this {
        this.type = "update";
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

    //from(tableName: string, alias: string): this;
    from(entity: Function, alias?: string): this {
    //from(entityOrTableName: Function|string, alias: string): this {
        const aliasObj = new Alias(alias);
        aliasObj.target = entity;
        this._aliasMap.addMainAlias(aliasObj);
        this.froms = { alias: aliasObj };
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

    where(where: string): this {
        this.wheres.push({ type: "simple", condition: where });
        return this;
    }

    andWhere(where: string): this {
        this.wheres.push({ type: "and", condition: where });
        return this;
    }

    orWhere(where: string): this {
        this.wheres.push({ type: "or", condition: where });
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

    setParameter(key: string, value: any): this {
        this.parameters[key] = value;
        return this;
    }

    setParameters(parameters: Object): this {
        Object.keys(parameters).forEach(key => this.parameters[key] = (<any> parameters)[key]);
        return this;
    }

    getSql(): string {
        // joins are before because their many-to-many relations can add aliases
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
    
    execute(): Promise<void> {
        return this.connection.driver.query(this.getSql()).then(() => {});
    }
    
    getScalarResults<T>(): Promise<T[]> {
        return this.connection.driver.query<T[]>(this.getSql());
    }

    getSingleScalarResult<T>(): Promise<T> {
        return this.getScalarResults().then(results => results[0]);
    }

    getResults(): Promise<Entity[]> {
        return this.connection.driver
            .query<any[]>(this.getSql())
            .then(results => this.rawResultsToEntities(results));
    }

    getSingleResult(): Promise<Entity> {
        return this.getResults().then(entities => {
            console.log(this.getSql());
            console.log(entities);
            return entities[0];
        });
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
        const metadata =  this._aliasMap.getEntityMetadataByAlias(this.froms.alias);
        const tableName = metadata.table.name;
        const alias = this.froms.alias.name;
        const allSelects: string[] = [];

        // add select from the main table
        if (this.selects.indexOf(alias) !== -1)
            metadata.columns.forEach(column => {
                allSelects.push(alias + "." + column.name + " AS " + alias + "_" + column.name);
            });

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
        
        switch (this.type) {
            case "select":
                return "SELECT " + allSelects.join(", ") + " FROM " + tableName + " " + alias;
            case "update":
                return "UPDATE " + tableName + " " + alias;
            case "delete":
                return "DELETE " + tableName + " " + alias;
        }
        return "";
    }

    protected createWhereExpression() {
        if (!this.wheres || !this.wheres.length) return "";

        return " WHERE " + this.wheres.map(where => {
            switch (where.type) {
                case "and":
                    return "AND " + where.condition;
                case "or":
                    return "OR " + where.condition;
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
                const condition1 = junctionAlias + "." + parentTable + "_" + parentTableColumn + "=" + parentAlias + "." + joinTableColumn; // todo: use column names from junction table somehow
                const condition2 = joinAlias + "." + joinTableColumn + "=" + junctionAlias + "." + joinTable + "_" + joinTableColumn;
                
                return " " + joinType + " JOIN " + junctionTable + " " + junctionAlias + " " + join.conditionType + " " + condition1 +
                       " " + joinType + " JOIN " + joinTable + " " + joinAlias + " " + join.conditionType + " " + condition2 + appendedCondition;
                
            } else if (relation.isOneToOne || relation.isManyToOne) {
                const condition = join.alias.name + "." + joinTableColumn + "=" + parentAlias + "." + join.alias.parentPropertyName;
                return " " + joinType + " JOIN " + joinTable + " " + join.alias.name + " " + join.conditionType + " " + condition + appendedCondition;

            } else if (relation.isOneToMany) {
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
        Object.keys(this.parameters).forEach(key => {
            sql = sql.replace(":" + key, '"' + this.parameters[key] + '"'); // .replace('"', '')
        });
        return sql;
    }

}
