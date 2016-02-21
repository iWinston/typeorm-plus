import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";
import {ColumnMetadata} from "../../metadata-builder/metadata/ColumnMetadata";
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
    private froms: { entity: Function, alias: string };
    private leftJoins: { join: Function, alias: string, conditionType: string, condition: string }[] = [];
    private innerJoins: { join: Function, alias: string, conditionType: string, condition: string }[] = [];
    private groupBys: string[] = [];
    private wheres: { type: "simple"|"and"|"or", condition: string }[] = [];
    private havings: { type: "simple"|"and"|"or", condition: string }[] = [];
    private orderBys: { sort: string, order: "ASC"|"DESC" }[] = [];
    private parameters: { [key: string]: string } = {};
    private limit: number;
    private offset: number;

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
        this.froms = { entity: entity, alias: alias };
        return this;
    }

    innerJoin(target: Function, alias: string, conditionType: string, condition: string): this {
        this.innerJoins.push({ join: target, alias: alias, conditionType: conditionType, condition: condition });
        return this;
    }

    leftJoin(target: Function, alias: string, conditionType: string, condition: string): this {
        this.leftJoins.push({ join: target, alias: alias, conditionType: conditionType, condition: condition });
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

    setParameter(key: string, value: string): this {
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
            throw new Error("Metadata for " + this.froms.entity + " was not found.");
        
        return metadata;
    }

    protected createSelectExpression() {
        // todo throw exception if selects or from is missing

        const metadata = this.findMetadata(this.froms.entity);
        const tableName = metadata.table.name;
        const alias = this.froms.alias ? this.froms.alias : metadata.table.name;
        const columns: string[] = [];

        // add select from the main table
        if (this.selects.indexOf(this.froms.alias) !== -1)
            metadata.columns.forEach(column => {
                columns.push(this.froms.alias + "." + column.name + " AS " + this.froms.alias + "_" + column.name);
            });

        // add selects from left and inner joins
        this.leftJoins.concat(this.innerJoins)
            .filter(join => this.selects.indexOf(join.alias) !== -1)
            .forEach(join => {
                const joinMetadata = this.findMetadata(join.join);
                joinMetadata.columns.forEach(column => {
                    columns.push(join.alias + "." + column.name + " AS " + join.alias + "_" + column.name);
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
            const joinMetadata = this.entityMetadatas.find(metadata => metadata.target === join.join); // todo: throw exception if not found
            const relationTable = joinMetadata.table.name;
            return " INNER JOIN " + relationTable + " " + join.alias + " " + join.conditionType + " " + join.condition;
        }).join(" ");
    }

    protected createLeftJoinExpression() {
        if (!this.leftJoins || !this.leftJoins.length) return "";

        return this.leftJoins.map(join => {
            const joinMetadata = this.findMetadata(join.join);
            const relationTable = joinMetadata.table.name;
            return " LEFT JOIN " + relationTable + " " + join.alias + " " + join.conditionType + " " + join.condition;
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
    
    protected replaceTableNames(sql: string) {
        return sql.replace("\$\$", "");
    }

}
