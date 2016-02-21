/**
 * @author Umed Khudoiberdiev <info@zar.tj>
 */
export class QueryBuilder {

    // -------------------------------------------------------------------------
    // Public properties
    // -------------------------------------------------------------------------

    getTableNameFromEntityCallback: (entity: Function) => string;

    // -------------------------------------------------------------------------
    // Pirvate properties
    // -------------------------------------------------------------------------

    private type: "select"|"update"|"delete";
    private selects: string[] = [];
    private froms: { entityOrTableName: Function|string, alias: string };
    private leftJoins: { join: string, alias: string, conditionType: string, condition: string }[] = [];
    private innerJoins: { join: string, alias: string, conditionType: string, condition: string }[] = [];
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

    select(selection: string): this;
    select(selection: string[]): this;
    select(selection: string|string[]): this {
        this.type = "select";
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

    from(tableName: string, alias: string): this;
    from(entity: Function, alias: string): this;
    from(entityOrTableName: Function|string, alias: string): this {
        this.froms = { entityOrTableName: entityOrTableName, alias: alias };
        return this;
    }

    innerJoin(join: string, alias: string, conditionType: string, condition: string): this {
        this.innerJoins.push({ join: join, alias: alias, conditionType: conditionType, condition: condition });
        return this;
    }

    leftJoin(join: string, alias: string, conditionType: string, condition: string): this {
        this.leftJoins.push({ join: join, alias: alias, conditionType: conditionType, condition: condition });
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
        sql += this.createWhereExpression();
        sql += this.createLeftJoinExpression();
        sql += this.createInnerJoinExpression();
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

    protected getTableName() {
        if (this.froms.entityOrTableName instanceof Function) {
            return this.getTableNameFromEntityCallback(this.froms.entityOrTableName);
        } else {
            return <string> this.froms.entityOrTableName;
        }

    }

    protected createSelectExpression() {
        // todo throw exception if selects or from missing
        const tableName = this.getTableName();
        switch (this.type) {
            case "select":
                return "SELECT " + this.selects.join(", ") + " FROM " + tableName + " " + this.froms.alias;// + " ";
            case "update":
                return "UPDATE " + tableName + " " + this.froms.alias;// + " ";
            case "delete":
                return "DELETE " + tableName + " " + this.froms.alias;// + " ";
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
            return " INNER JOIN " + join.join + " " + join.alias + " " + join.conditionType + " " + join.condition;
        }).join(" ");
    }

    protected createLeftJoinExpression() {
        if (!this.leftJoins || !this.leftJoins.length) return "";

        return this.leftJoins.map(join => {
            return " LEFT JOIN " + join.join + " " + join.alias + " " + join.conditionType + " " + join.condition;
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
