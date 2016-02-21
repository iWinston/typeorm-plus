import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";

export class Alias {
    isMain: boolean;
    entityMetadata: EntityMetadata;
    name: string;
    parentPropertyName: string;
    parentAliasName: string;

    constructor(name: string, entityMetadata: EntityMetadata, parentAliasName?: string, parentPropertyName?: string) {
        this.name = name;
        this.entityMetadata = entityMetadata;
        this.parentAliasName = parentAliasName;
        this.parentPropertyName = parentPropertyName;
    }
}

export class AliasMap {
    constructor(public aliases: Alias[] = []) {
    }

    addMainAlias(alias: Alias) {
        const mainAlias = this.getMainAlias();
        if (mainAlias)
            this.aliases.splice(this.aliases.indexOf(mainAlias), 1);

        alias.isMain = true;
        this.aliases.push(alias);
    }

    addAlias(alias: Alias) {
        this.aliases.push(alias);
    }

    getMainAlias() {
        return this.aliases.find(alias => alias.isMain);
    }

    findAliasByName(name: string) {
        return this.aliases.find(alias => alias.name === name);
    }

    findAliasByParent(parentAliasName: string, parentPropertyName: string) {
        return this.aliases.find(alias => {
            return alias.parentAliasName === parentAliasName && alias.parentPropertyName === parentPropertyName;
        });
    }
}

/**
 * @author Umed Khudoiberdiev <info@zar.tj>
 */
export class QueryBuilder {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private entityMetadatas: EntityMetadata[]) {
    }

    // -------------------------------------------------------------------------
    // Pirvate properties
    // -------------------------------------------------------------------------

    private type: "select"|"update"|"delete";
    private selects: string[] = [];
    private froms: { alias: Alias };
    private leftJoins: { alias: Alias, conditionType: string, condition: string }[] = [];
    private innerJoins: { alias: Alias, conditionType: string, condition: string }[] = [];
    private groupBys: string[] = [];
    private wheres: { type: "simple"|"and"|"or", condition: string }[] = [];
    private havings: { type: "simple"|"and"|"or", condition: string }[] = [];
    private orderBys: { sort: string, order: "ASC"|"DESC" }[] = [];
    private parameters: { [key: string]: string } = {};
    private limit: number;
    private offset: number;

    private aliasMap = new AliasMap();

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    //delete(selection: string): this;
    //delete(selection: string[]): this;
    //delete(selection: string|string[]): this {
    delete(): this {
        this.type = "delete";
        // this.addSelection(selection);
        return this;
    }

    // update(selection: string): this;
    // update(selection: string[]): this;
    // update(selection: string|string[]): this {
    update(): this {
        this.type = "update";
        // this.addSelection(selection);
        return this;
    }

    select(selection?: string): this;
    select(selection?: string[]): this;
    select(selection?: string|string[]): this {
        this.type = "select";
        if (selection)
            this.addSelection(selection);
        return this;
    }

    addSelect(selection: string): this;
    addSelect(selection: string[]): this;
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
        const aliasObj = new Alias(alias, this.findMetadata(entity));
        this.aliasMap.addMainAlias(aliasObj);
        this.froms = { alias: aliasObj };
        return this;
    }

    innerJoin(property: string, alias: string, conditionType: string, condition: string): this;
    innerJoin(entity: Function, alias: string, conditionType: string, condition: string): this;
    innerJoin(entityOrProperty: Function|string, alias: string, conditionType: string, condition: string): this {
        let parentPropertyName = "", parentAliasName = "";
        let entityMetadata: EntityMetadata;
        if (entityOrProperty instanceof Function) {
            entityMetadata = this.findMetadata(entityOrProperty);
        } else {
            parentAliasName = (<string> entityOrProperty).split(".")[0];
            parentPropertyName = (<string> entityOrProperty).split(".")[1];
            const parentAliasMetadata = this.aliasMap.findAliasByName(parentAliasName).entityMetadata;
            entityMetadata = parentAliasMetadata.findRelationWithDbName(parentPropertyName).relatedEntityMetadata;
        }

        const aliasObj = new Alias(alias, entityMetadata, parentAliasName, parentPropertyName);
        this.aliasMap.addAlias(aliasObj);
        this.innerJoins.push({ alias: aliasObj, conditionType: conditionType, condition: condition });
        return this;
    }

    leftJoin(property: string, alias: string, conditionType: string, condition: string): this;
    leftJoin(entity: Function, alias: string, conditionType: string, condition: string): this;
    leftJoin(entityOrProperty: Function|string, alias: string, conditionType: string, condition: string): this {
        let parentPropertyName = "", parentAliasName = "";
        let entityMetadata: EntityMetadata;
        if (entityOrProperty instanceof Function) {
            entityMetadata = this.findMetadata(entityOrProperty);
        } else {
            parentAliasName = (<string> entityOrProperty).split(".")[0];
            parentPropertyName = (<string> entityOrProperty).split(".")[1];
            const parentAliasMetadata = this.aliasMap.findAliasByName(parentAliasName).entityMetadata;
            entityMetadata = parentAliasMetadata.findRelationByPropertyName(parentPropertyName).relatedEntityMetadata;
        }

        const aliasObj = new Alias(alias, entityMetadata, parentAliasName, parentPropertyName);
        this.aliasMap.addAlias(aliasObj);
        this.leftJoins.push({ alias: aliasObj, conditionType: conditionType, condition: condition });
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
        let sql = this.createSelectExpression();
        sql += this.createLeftJoinExpression();
        sql += this.createInnerJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        sql  = this.replaceParameters(sql);
        return sql;
    }
    
    generateAliasMap(): AliasMap {
        return this.aliasMap;
       /* const aliasesFromInnerJoins = this.innerJoins.map(join => join.alias);
        const aliasesFromLeftJoins = this.leftJoins.map(join => join.alias);
        return new AliasMap([this.froms.alias, ...aliasesFromLeftJoins, ...aliasesFromInnerJoins]);*/
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected addSelection(selection: string|string[]) {

        if (selection instanceof Array)
            this.selects = selection;
        else
            this.selects = [selection];
        /*if (typeof selection === 'function') {
         this.selects = this.selects.concat(selection(this.generatePropertyValuesEntity()));

         } else if (typeof selection === 'string') {
         this.selects.push(selection);

         } else if (selection instanceof Array) {
         this.selects = this.selects.concat(selection);
         }*/
    }

    protected findMetadata(target: Function) {
        const metadata = this.entityMetadatas.find(metadata => metadata.target === target);
        if (!metadata)
            throw new Error("Metadata for " + (<any>target).name + " was not found.");
        
        return metadata;
    }

    protected createSelectExpression() {
        // todo throw exception if selects or from is missing

        const metadata = this.froms.alias.entityMetadata;
        const tableName = metadata.table.name;
        const alias = this.froms.alias.name;
        const columns: string[] = [];

        // add select from the main table
        if (this.selects.indexOf(alias) !== -1)
            metadata.columns.forEach(column => {
                columns.push(alias + "." + column.name + " AS " + alias + "_" + column.name);
            });

        // add selects from left and inner joins
        this.leftJoins.concat(this.innerJoins)
            .filter(join => this.selects.indexOf(join.alias.name) !== -1)
            .forEach(join => {
                const joinMetadata = join.alias.entityMetadata;
                joinMetadata.columns.forEach(column => {
                    columns.push(join.alias.name + "." + column.name + " AS " + join.alias.name + "_" + column.name);
                });
            });
        
        switch (this.type) {
            case "select":
                return "SELECT " + columns.join(", ") + " FROM " + tableName + " " + alias;
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

    protected createInnerJoinExpression() {
        if (!this.innerJoins || !this.innerJoins.length) return "";

        return this.innerJoins.map(join => {
            const joinMetadata = join.alias.entityMetadata; // todo: throw exception if not found
            const relationTable = joinMetadata.table.name;
            return " INNER JOIN " + relationTable + " " + join.alias.name + " " + join.conditionType + " " + join.condition;
        }).join(" ");
    }

    protected createLeftJoinExpression() {
        if (!this.leftJoins || !this.leftJoins.length) return "";

        return this.leftJoins.map(join => {
            const joinMetadata = join.alias.entityMetadata;
            const relationTable = joinMetadata.table.name;
            return " LEFT JOIN " + relationTable + " " + join.alias.name + " " + join.conditionType + " " + join.condition;
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
