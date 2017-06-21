import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {Connection} from "../connection/Connection";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";
import {LockNotSupportedOnGivenDriverError} from "./error/LockNotSupportedOnGivenDriverError";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {QueryExpressionMap} from "./QueryExpressionMap";
import {SelectQuery} from "./SelectQuery";
import {OracleDriver} from "../driver/oracle/OracleDriver";
import {SelectQueryBuilder} from "./SelectQueryBuilder";
import {UpdateQueryBuilder} from "./UpdateQueryBuilder";
import {DeleteQueryBuilder} from "./DeleteQueryBuilder";
import {InsertQueryBuilder} from "./InsertQueryBuilder";
import {RelationQueryBuilder} from "./RelationQueryBuilder";

// todo: completely cover query builder with tests
// todo: entityOrProperty can be target name. implement proper behaviour if it is.
// todo: check in persistment if id exist on object and throw exception (can be in partial selection?)
// todo: fix problem with long aliases eg getMaxIdentifierLength
// todo: fix replacing in .select("COUNT(post.id) AS cnt") statement
// todo: implement joinAlways in relations and relationId
// todo: finish partial selection
// todo: sugar methods like: .addCount and .selectCount, selectCountAndMap, selectSum, selectSumAndMap, ...
// todo: implement @Select decorator

// todo: implement subselects for WHERE, FROM, SELECT
// .fromSubSelect()
// .whereSubSelect()
// .addSubSelect()
// .addSubSelectAndMap()
// use qb => qb.select().from().where() syntax where needed

// todo: implement relation/entity loading and setting them into properties within a separate query
// .loadAndMap("post.categories", "post.categories", qb => ...)
// .loadAndMap("post.categories", Category, qb => ...)

// todo: implement streaming
// .stream(): ReadStream

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export abstract class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Protected properties
    // -------------------------------------------------------------------------

    /**
     * Connection on which QueryBuilder was created.
     */
    protected connection: Connection;

    /**
     * Query runner used to execute query builder query.
     */
    protected queryRunner: QueryRunner;

    /**
     * Indicates if query runner was created by QueryBuilder itself, or came from outside.
     * If it was created by query builder then it will be released by it once it done.
     * Otherwise it should be released by owner who sent QueryRunner into this QueryBuilder.
     */
    protected ownQueryRunner: boolean;

    /**
     * Contains all properties of the QueryBuilder that needs to be build a final query.
     */
    protected expressionMap: QueryExpressionMap;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(queryBuilder: QueryBuilder<any>);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connection: Connection, queryRunner?: QueryRunner);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connectionOrQueryBuilder: Connection|QueryBuilder<any>, queryRunner?: QueryRunner) {
        if (connectionOrQueryBuilder instanceof QueryBuilder) {
            this.connection = connectionOrQueryBuilder.connection;
            this.queryRunner = connectionOrQueryBuilder.queryRunner || this.connection.createQueryRunner();
            this.ownQueryRunner = connectionOrQueryBuilder.queryRunner ? false : true;
            this.expressionMap = connectionOrQueryBuilder.expressionMap.clone();

        } else {
            this.connection = connectionOrQueryBuilder;
            this.queryRunner = queryRunner || this.connection.createQueryRunner();
            this.ownQueryRunner = queryRunner ? false : true;
            this.expressionMap = new QueryExpressionMap(this.connection);
        }
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
    select(): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string, selectionAliasName?: string): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string[]): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection?: string|string[], selectionAliasName?: string): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select";
        if (selection instanceof Array) {
            this.expressionMap.selects = selection.map(selection => ({ selection: selection }));
        } else if (selection) {
            this.expressionMap.selects = [{ selection: selection, aliasName: selectionAliasName }];
        }

        // loading it dynamically because of circular issue
        const SelectQueryBuilderCls = require("./SelectQueryBuilder").SelectQueryBuilder;
        if (this instanceof SelectQueryBuilderCls)
            return this as any;

        return new SelectQueryBuilderCls(this);
    }

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string, selectionAliasName?: string): SelectQueryBuilder<Entity>;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string[]): SelectQueryBuilder<Entity>;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string|string[], selectionAliasName?: string): SelectQueryBuilder<Entity> {
        if (selection instanceof Array) {
            this.expressionMap.selects = this.expressionMap.selects.concat(selection.map(selection => ({ selection: selection })));
        } else {
            this.expressionMap.selects.push({ selection: selection, aliasName: selectionAliasName });
        }

        // loading it dynamically because of circular issue
        const SelectQueryBuilderCls = require("./SelectQueryBuilder").SelectQueryBuilder;
        if (this instanceof SelectQueryBuilderCls)
            return this as any;

        return new SelectQueryBuilderCls(this);
    }

    /**
     * Creates INSERT query.
     */
    insert(): InsertQueryBuilder<Entity> {
        this.expressionMap.queryType = "insert";

        // loading it dynamically because of circular issue
        const InsertQueryBuilderCls = require("./InsertQueryBuilder").InsertQueryBuilder;
        if (this instanceof InsertQueryBuilderCls)
            return this as any;

        return new InsertQueryBuilderCls(this);
    }

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(updateSet: ObjectLiteral): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update(entity: Function|string, updateSet: ObjectLiteral): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(tableName: string, updateSet: ObjectLiteral): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(entityOrTableNameUpdateSet?: string|Function|ObjectLiteral, maybeUpdateSet?: ObjectLiteral): UpdateQueryBuilder<Entity> {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : entityOrTableNameUpdateSet as ObjectLiteral|undefined;

        if (entityOrTableNameUpdateSet instanceof Function || typeof entityOrTableNameUpdateSet === "string")
            this.setMainAlias(entityOrTableNameUpdateSet);

        this.expressionMap.queryType = "update";
        this.expressionMap.valuesSet = updateSet;

        // loading it dynamically because of circular issue
        const UpdateQueryBuilderCls = require("./UpdateQueryBuilder").UpdateQueryBuilder;
        if (this instanceof UpdateQueryBuilderCls)
            return this as any;

        return new UpdateQueryBuilderCls(this);
    }

    /**
     * Creates DELETE query.
     */
    delete(): DeleteQueryBuilder<Entity> {
        this.expressionMap.queryType = "delete";

        // loading it dynamically because of circular issue
        const DeleteQueryBuilderCls = require("./DeleteQueryBuilder").DeleteQueryBuilder;
        if (this instanceof DeleteQueryBuilderCls)
            return this as any;

        return new DeleteQueryBuilderCls(this);
    }

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(entityTarget: Function|string, propertyPath: string): RelationQueryBuilder<Entity> {
        this.expressionMap.queryType = "relation";
        // qb.expressionMap.propertyPath = propertyPath;
        this.setMainAlias(entityTarget);

        // loading it dynamically because of circular issue
        const RelationQueryBuilderCls = require("./RelationQueryBuilder").RelationQueryBuilder;
        if (this instanceof RelationQueryBuilderCls)
            return this as any;

        return new RelationQueryBuilderCls(this);
    }

    /**
     * Sets parameter name and its value.
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
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const values = metadata.childEntityMetadatas
                    .filter(childMetadata => childMetadata.discriminatorColumn)
                    .map(childMetadata => childMetadata.discriminatorValue);
                values.push(metadata.discriminatorValue);
                parameters["discriminatorColumnValues"] = values;
            }
        }

        return parameters;
    }

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
        return sql.trim();
    }

    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    getSql(): string {
        return this.connection.driver.escapeQueryWithParameters(this.getQuery(), this.expressionMap.parameters)[0];
    }

    /**
     * Gets sql to be executed with all parameters used in it.
     */
    getSqlAndParameters(options?: { skipOrderBy?: boolean }): [string, any[]] {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        if (!options || !options.skipOrderBy)
            sql += this.createOrderByExpression();
        sql += this.createLimitOffsetExpression();
        sql += this.createLockExpression();
        sql = this.createLimitOffsetOracleSpecificExpression(sql);
        return this.connection.driver.escapeQueryWithParameters(sql, this.getParameters());
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<any> {
        const [sql, parameters] = this.getSqlAndParameters();
        try {
            return await this.queryRunner.query(sql, parameters);  // await is needed here because we are using finally

        } finally {
            if (this.ownQueryRunner) // means we created our own query runner
                await this.queryRunner.release();
        }
    }

    /**
     * Creates a completely new query builder.
     */
    createQueryBuilder(): this {
        return new (this.constructor as any)(this.connection);
    }

    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder using its constructor, for example new SelectQueryBuilder(queryBuilder)
     * where queryBuilder is cloned QueryBuilder.
     */
    clone(): this {
        const qb = this.createQueryBuilder();
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
        return this.connection.driver.escapeAlias(name);
    }

    /**
     * Escapes column name using current database's escaping character.
     */
    escapeColumn(name: string) {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escapeColumn(name);
    }

    /**
     * Escapes table name using current database's escaping character.
     */
    escapeTable(name: string) {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escapeTable(name);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    protected setMainAlias(entityTarget: Function|string, aliasName?: string): this {

        // if table has a metadata then find it to properly escape its properties
        // const metadata = this.connection.entityMetadatas.find(metadata => metadata.tableName === tableName);
        if (entityTarget instanceof Function || this.connection.hasMetadata(entityTarget)) {
            this.expressionMap.createMainAlias({
                name: aliasName,
                metadata: this.connection.getMetadata(entityTarget),
            });

        } else {
            this.expressionMap.createMainAlias({
                name: aliasName,
                tableName: entityTarget,
            });
        }
        return this;
    }

    protected buildEscapedEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const hasMainAlias = this.expressionMap.selects.some(select => select.selection === aliasName);

        const columns: ColumnMetadata[] = hasMainAlias ? metadata.columns : metadata.columns.filter(column => {
            return this.expressionMap.selects.some(select => select.selection === aliasName + "." + column.propertyName);
        });

        return columns.map(column => {
            const selection = this.expressionMap.selects.find(select => select.selection === aliasName + "." + column.propertyName);
            return {
                selection: this.escapeAlias(aliasName) + "." + this.escapeColumn(column.databaseName),
                aliasName: selection && selection.aliasName ? selection.aliasName : aliasName + "_" + column.databaseName,
                // todo: need to keep in mind that custom selection.aliasName breaks hydrator. fix it later!
            };
            // return this.escapeAlias(aliasName) + "." + this.escapeColumn(column.fullName) +
            //     " AS " + this.escapeAlias(aliasName + "_" + column.fullName);
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
            const metadata = this.expressionMap.mainAlias.metadata;
            tableName = metadata.tableName;

            allSelects.push(...this.buildEscapedEntityColumnSelects(aliasName, metadata));
            excludedSelects.push(...this.findEntityColumnSelects(aliasName, metadata));

        } else { // if alias does not have metadata - selections will be from custom table
            tableName = this.expressionMap.mainAlias.tableName!;
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
                        allSelects.push({ selection: ea(join.alias.name!) + ".*" });
                        excludedSelects.push({ selection: ea(join.alias.name!) });
                    }
                }
            });

        if (!this.expressionMap.ignoreParentTablesJoins && this.expressionMap.mainAlias.hasMetadata) {
            const metadata = this.expressionMap.mainAlias.metadata;
            if (metadata.parentEntityMetadata && metadata.parentEntityMetadata.inheritanceType === "class-table" && metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + metadata.parentEntityMetadata.tableName;
                metadata.parentEntityMetadata.columns.forEach(column => {
                    // TODO implement partial select
                    allSelects.push({ selection: ea(alias) + "." + ec(column.databaseName), aliasName: alias + "_" + column.databaseName });
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
                if ((this.expressionMap.limit || this.expressionMap.offset) && this.connection.driver instanceof OracleDriver) {
                    return "SELECT ROWNUM " + this.escapeAlias("RN") + "," + selection + " FROM " + this.escapeTable(tableName) + " " + ea(aliasName) + lock;
                }
                return "SELECT " + selection + " FROM " + this.escapeTable(tableName) + " " + ea(aliasName) + lock;
            case "delete":
                return "DELETE FROM " + et(tableName); // TODO: only mysql supports aliasing, so what to do with aliases in DELETE queries? right now aliases are used however we are relaying that they will always match a table names // todo: replace aliases in where to nothing?
            case "update":
                let valuesSet = this.expressionMap.valuesSet as ObjectLiteral;
                if (!valuesSet)
                    throw new Error(`Cannot perform update query because updation values are not defined.`);

                const updateSet: string[] = [];
                Object.keys(valuesSet).forEach(columnProperty => {
                    const column = this.expressionMap.mainAlias!.metadata.findColumnWithPropertyName(columnProperty);
                    if (column) {
                        const paramName = "_updated_" + column.databaseName;
                        this.setParameter(paramName, valuesSet[column.propertyName]);
                        updateSet.push(ea(column.databaseName) + "=:" + paramName);
                    }
                });
                return `UPDATE ${this.escapeTable(tableName)} ${aliasName ? ea(aliasName) : ""} SET ${updateSet.join(", ")}`; // todo: replace aliases in where to nothing?
            case "insert":
                let valuesSets: ObjectLiteral[] = []; // todo: check if valuesSet is defined and has items if its an array
                if (this.expressionMap.valuesSet instanceof Array && this.expressionMap.valuesSet.length > 0) {
                    valuesSets = this.expressionMap.valuesSet;
                } else if (this.expressionMap.valuesSet instanceof Object) {
                    valuesSets = [this.expressionMap.valuesSet];
                } else {
                    throw new Error(`Cannot perform insert query because values are not defined.`);
                }

                const columns: ColumnMetadata[] = [];
                Object.keys(valuesSets[0]).forEach(columnProperty => {
                    const column = this.expressionMap.mainAlias!.metadata.findColumnWithPropertyName(columnProperty);
                    if (column) columns.push(column);
                });
                const values = valuesSets.map((valueSet, key) => {
                    return "(" + columns.map(column => {
                        const paramName = ":_inserted_" + key + "_" + column.databaseName;
                        this.setParameter(paramName, valueSet[column.propertyName]);
                        return paramName;
                    }).join(",") + ")";
                }).join(", ");
                return `INSERT INTO ${this.escapeTable(tableName)}(${columns.map(column => column.databaseName)}) VALUES ${values}`;
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
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const condition = `${this.replacePropertyNames(this.expressionMap.mainAlias!.name + "." + metadata.discriminatorColumn.databaseName)} IN (:discriminatorColumnValues)`;
                return ` WHERE ${ conditions.length ? "(" + conditions + ") AND" : "" } ${condition}`;
            }
        }

        if (!conditions.length) // TODO copy in to discriminator condition
            return this.expressionMap.extraAppendedAndWhereCondition ? " WHERE " + this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition) : "";

        if (this.expressionMap.extraAppendedAndWhereCondition)
            return " WHERE (" + conditions + ") AND " + this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition);

        return " WHERE " + conditions;
    }

    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    protected replacePropertyNames(statement: string) {
        this.expressionMap.aliases.forEach(alias => {
            if (!alias.hasMetadata) return;
            alias.metadata.columns.forEach(column => {
                const expression = "([ =\(]|^.{0})" + alias.name + "\\." + column.propertyPath + "([ =\)\,]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), "$1" + this.escapeAlias(alias.name) + "." + this.escapeColumn(column.databaseName) + "$2");
                const expression2 = "([ =\(]|^.{0})" + alias.name + "\\." + column.propertyName + "([ =\)\,]|.{0}$)";
                statement = statement.replace(new RegExp(expression2, "gm"), "$1" + this.escapeAlias(alias.name) + "." + this.escapeColumn(column.databaseName) + "$2");
            });
            alias.metadata.relations.forEach(relation => {
                [...relation.joinColumns, ...relation.inverseJoinColumns].forEach(joinColumn => {
                    const expression = "([ =\(]|^.{0})" + alias.name + "\\." + relation.propertyPath + "\\." + joinColumn.referencedColumn!.propertyPath + "([ =\)\,]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), "$1" + this.escapeAlias(alias.name) + "." + this.escapeColumn(joinColumn.databaseName) + "$2"); // todo: fix relation.joinColumns[0], what if multiple columns
                });
                if (relation.joinColumns.length > 0) {
                    const expression = "([ =\(]|^.{0})" + alias.name + "\\." + relation.propertyPath + "([ =\)\,]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), "$1" + this.escapeAlias(alias.name) + "." + this.escapeColumn(relation.joinColumns[0].databaseName) + "$2"); // todo: fix relation.joinColumns[0], what if multiple columns
                }
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
            const destinationTableAlias = joinAttr.alias.name;
            const appendedCondition = joinAttr.condition ? " AND (" + joinAttr.condition + ")" : "";
            const parentAlias = joinAttr.parentAlias;

            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation)
                return " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) +
                    (joinAttr.condition ? " ON " + this.replacePropertyNames(joinAttr.condition) : "");

            // if real entity relation is involved
            if (relation.isManyToOne || relation.isOneToOneOwner) {

                // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                const condition = relation.joinColumns.map(joinColumn => {
                    return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" +
                        parentAlias + "." + relation.propertyPath + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                return " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) + " ON " + this.replacePropertyNames(condition + appendedCondition);

            } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {

                // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                const condition = relation.inverseRelation!.joinColumns.map(joinColumn => {
                    return destinationTableAlias + "." + relation.inverseRelation!.propertyPath + "." + joinColumn.referencedColumn!.propertyPath + "=" +
                        parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                return " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) + " ON " + this.replacePropertyNames(condition + appendedCondition);

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

                return " " + joinAttr.direction + " JOIN " + et(junctionTableName) + " " + ea(junctionAlias) + " ON " + this.replacePropertyNames(junctionCondition) +
                       " " + joinAttr.direction + " JOIN " + et(destinationTableName) + " " + ea(destinationTableAlias) + " ON " + this.replacePropertyNames(destinationCondition + appendedCondition);

            }
        });

        if (!this.expressionMap.ignoreParentTablesJoins && this.expressionMap.mainAlias!.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.parentEntityMetadata && metadata.parentEntityMetadata.inheritanceType === "class-table" && metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + metadata.parentEntityMetadata.tableName;
                const condition = metadata.parentIdColumns.map(parentIdColumn => {
                    return this.expressionMap.mainAlias!.name + "." + parentIdColumn.propertyPath + " = " + alias + "." + parentIdColumn.referencedColumn!.propertyPath;
                }).join(" AND ");
                const join = " JOIN " + et(metadata.parentEntityMetadata.tableName) + " " + ea(alias) + " ON " + this.replacePropertyNames(condition);
                joins.push(join);
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
            orderBys = this.expressionMap.mainAlias!.metadata.orderBy || {};
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

    protected createLimitOffsetOracleSpecificExpression(sql: string): string {
         if ((this.expressionMap.offset || this.expressionMap.limit) && this.connection.driver instanceof OracleDriver) {
             sql = "SELECT * FROM (" + sql + ") WHERE ";
             if (this.expressionMap.offset) {
                 sql += this.escapeAlias("RN") + " >= " + this.expressionMap.offset;
             }
             if (this.expressionMap.limit) {
                 sql += (this.expressionMap.offset ? " AND " : "") + this.escapeAlias("RN") + " <= " + ((this.expressionMap.offset || 0) + this.expressionMap.limit);
             }
         }
         return sql;
    }

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
            // if (metadata.hasMultiplePrimaryKeys) {
                metadata.primaryColumns.forEach((primaryColumn, secondIndex) => {
                    whereSubStrings.push(ea(alias) + "." + ec(primaryColumn.databaseName) + "=:id_" + index + "_" + secondIndex);
                    parameters["id_" + index + "_" + secondIndex] = primaryColumn.getEntityValue(id);
                });
                metadata.parentIdColumns.forEach((parentIdColumn, secondIndex) => {
                    whereSubStrings.push(ea(alias) + "." + ec(parentIdColumn.databaseName) + "=:parentId_" + index + "_" + secondIndex);
                    parameters["parentId_" + index + "_" + secondIndex] = parentIdColumn.getEntityValue(id);
                });
            // } else {
            //     if (metadata.primaryColumns.length > 0) {
            //         whereSubStrings.push(ea(alias) + "." + ec(metadata.firstPrimaryColumn.fullName) + "=:id_" + index);
            //         parameters["id_" + index] = id;
            //
            //     } else if (metadata.parentIdColumns.length > 0) {
            //         whereSubStrings.push(ea(alias) + "." + ec(metadata.parentIdColumns[0].fullName) + "=:parentId_" + index);
            //         parameters["parentId_" + index] = id;
            //     }
            // }
            return whereSubStrings.join(" AND ");
        });

        const whereString = whereStrings.length > 1 ? "(" + whereStrings.join(" OR ") + ")" : whereStrings[0];
        return [whereString, parameters];
    }

}
