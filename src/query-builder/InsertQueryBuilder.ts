import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ObjectType} from "../common/ObjectType";
import {QueryPartialEntity} from "./QueryPartialEntity";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {SqliteDriver} from "../driver/sqlite/SqliteDriver";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class InsertQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        let sql = this.createInsertExpression();
        return sql.trim();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies INTO which entity's table insertion will be executed.
     */
    into<T>(entityTarget: ObjectType<T>|string, columns?: string[]): InsertQueryBuilder<T> {
        const mainAlias = this.createFromAlias(entityTarget);
        this.expressionMap.setMainAlias(mainAlias);
        this.expressionMap.insertColumns = columns || [];
        return (this as any) as InsertQueryBuilder<T>;
    }

    /**
     * Values needs to be inserted into table.
     */
    values(values: QueryPartialEntity<Entity>|QueryPartialEntity<Entity>[]): this {
        this.expressionMap.valuesSet = values;
        return this;
    }

    /**
     * Optional returning/output clause.
     * This will return given column values.
     */
    output(columns: string[]): this;

    /**
     * Optional returning/output clause.
     * Returning is a SQL string containing returning statement.
     */
    output(output: string): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string|string[]): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string|string[]): this {
        return this.returning(output);
    }

    /**
     * Optional returning/output clause.
     * This will return given column values.
     */
    returning(columns: string[]): this;

    /**
     * Optional returning/output clause.
     * Returning is a SQL string containing returning statement.
     */
    returning(returning: string): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string|string[]): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string|string[]): this {

        // if nothing is specified then do not do anything - even throw exception
        // this is done for simplicity of usage in chain calls
        if (!returning || (returning instanceof Array && !returning.length))
            return this;

        // not all databases support returning/output cause
        if (!(this.connection.driver instanceof SqlServerDriver) && !(this.connection.driver instanceof PostgresDriver))
            throw new Error("OUTPUT or RETURNING clause only supported by Microsoft SQL Server or PostgreSQL. But you can specify array of columns you want to return.");

        this.expressionMap.returning = returning;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates INSERT express used to perform insert query.
     */
    protected createInsertExpression() { // todo: insertion into custom tables wont work because of binding to columns. fix it
        const valueSets = this.getValueSets();
        let values: string, columnNames: string;

        if (this.expressionMap.mainAlias!.hasMetadata) {
            const columns = this.expressionMap.mainAlias!.metadata.columns.filter(column => {

                // if user specified list of columns he wants to insert to, then we filter only them
                if (this.expressionMap.insertColumns.length)
                    return this.expressionMap.insertColumns.indexOf(column.propertyPath);

                // if user did not specified such list then return all columns except generated one
                if (column.isGenerated && column.generationStrategy === "increment")
                    return false;

                return true;
            });

            // get a table name and all column database names
            columnNames = columns.map(column => this.escape(column.databaseName)).join(", ");

            // get values needs to be inserted
            values = valueSets.map((valueSet, insertionIndex) => {
                const columnValues = columns.map(column => {
                    const paramName = "_inserted_" + insertionIndex + "_" + column.databaseName;

                    let value = column.getEntityValue(valueSet);
                    if (column.referencedColumn && value instanceof Object) {
                        value = column.referencedColumn.getEntityValue(value);
                    }
                    value = this.connection.driver.preparePersistentValue(value, column);

                    if (column.isVersion) {
                        return "1";

                    } else if (column.isCreateDate || column.isUpdateDate) {
                        return "NOW()";
                    }

                    if (value instanceof Function) { // support for SQL expressions in update query
                        return value();

                    } else if (value === undefined) {
                        if (this.connection.driver instanceof SqliteDriver) {
                            return "NULL";

                        } else {
                            return "DEFAULT";
                        }

                    } else {
                        if (this.connection.driver instanceof SqlServerDriver) {
                            this.setParameter(paramName, this.connection.driver.parametrizeValue(column, value));
                        } else {
                            this.setParameter(paramName, value);
                        }
                        return ":" + paramName;
                    }
                }).join(", ").trim();
                return columnValues ? "(" + columnValues + ")" : "";
            }).join(", ");

        } else { // for tables without metadata

            // get a table name and all column database names
            columnNames = this.expressionMap.insertColumns.join(", ");

            // get values needs to be inserted
            values = valueSets.map((valueSet, insertionIndex) => {
                const columnValues = Object.keys(valueSet).map(columnName => {
                    const paramName = "_inserted_" + insertionIndex + "_" + columnName;
                    const value = valueSet[columnName];

                    if (value instanceof Function) { // support for SQL expressions in update query
                        return value();

                    } else if (value === undefined) {
                        if (this.connection.driver instanceof SqliteDriver) {
                            return "NULL";

                        } else {
                            return "DEFAULT";
                        }

                    } else {
                        this.setParameter(paramName, value);
                        return ":" + paramName;
                    }
                }).join(", ").trim();
                return columnValues ? "(" + columnValues + ")" : "";
            }).join(", ");
        }

        const tableName = this.getTableName(this.getMainTableName());
        const returningExpression = this.createReturningExpression();

        // generate sql query
        let query = `INSERT INTO ${tableName}`;

        if (columnNames) {
            query += `(${columnNames})`;
        } else {
            if (!values && this.connection.driver instanceof MysqlDriver) // special syntax for mysql DEFAULT VALUES insertion
                query += "()";
        }

        if (returningExpression && this.connection.driver instanceof SqlServerDriver) {
            query += ` OUTPUT ${returningExpression}`;
        }

        if (values) {
            query += ` VALUES ${values}`;
        } else {
            if (this.connection.driver instanceof MysqlDriver) { // special syntax for mysql DEFAULT VALUES insertion
                query += " VALUES ()";
            } else {
                query += ` DEFAULT VALUES`;
            }
        }

        if (returningExpression && this.connection.driver instanceof PostgresDriver) {
            query += ` RETURNING ${returningExpression}`;
        }

        return query;
    }

    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSets(): ObjectLiteral[] {
        if (this.expressionMap.valuesSet instanceof Array && this.expressionMap.valuesSet.length > 0)
            return this.expressionMap.valuesSet;

        if (this.expressionMap.valuesSet instanceof Object)
            return [this.expressionMap.valuesSet];

        throw new Error(`Cannot perform insert query because values are not defined. Call "qb.values(...)" method to specify inserted values.`);
    }

}
