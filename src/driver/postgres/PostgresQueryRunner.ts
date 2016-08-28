import {QueryRunner} from "../QueryRunner";
import * as moment from "moment";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Logger} from "../../logger/Logger";
import {DatabaseConnection} from "../DatabaseConnection";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";

export class PostgresQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected databaseConnection: DatabaseConnection,
                protected logger: Logger) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     */
    release(): Promise<void> {
        if (this.databaseConnection.releaseCallback) {
            return this.databaseConnection.releaseCallback();
        }

        return Promise.resolve();
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as query FROM pg_tables WHERE schemaname = 'public'`;
        const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
        await Promise.all(dropQueries.map(q => this.query(q["query"])));
    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        if (this.databaseConnection.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        await this.query("START TRANSACTION");
        this.databaseConnection.isTransactionActive = true;
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.databaseConnection.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("ROLLBACK");
        this.databaseConnection.isTransactionActive = false;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        this.logger.logQuery(query);
        return new Promise<any[]>((ok, fail) => {
            this.databaseConnection.connection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query);
                    this.logger.logQueryError(err);
                    fail(err);
                } else {
                    ok(result.rows);
                }
            });
        });
    }

    /**
     * Insert a new row into given table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, idColumnName?: string): Promise<any> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => this.escapeColumnName(key)).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const sql = `INSERT INTO ${this.escapeTableName(tableName)}(${columns}) VALUES (${values}) ${ idColumnName ? " RETURNING " + this.escapeColumnName(idColumnName) : "" }`;
        const parameters = keys.map(key => keyValues[key]);
        const result: ObjectLiteral[] = await this.query(sql, parameters);
        if (idColumnName)
            return result[0][idColumnName];

        return result;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const query = `UPDATE ${this.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(query, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral): Promise<void> {
        const conditionString = this.parametrize(conditions).join(" AND ");
        const parameters = Object.keys(conditions).map(key => conditions[key]);
        const query = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(query, parameters);
    }

    /**
     * Inserts rows into closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${this.escapeTableName(tableName)}(ancestor, descendant, level) ` +
                `SELECT ancestor, ${newEntityId}, level + 1 FROM ${this.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${this.escapeTableName(tableName)}(ancestor, descendant) ` +
                `SELECT ancestor, ${newEntityId} FROM ${this.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any {
        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value === true ? 1 : 0;
            case ColumnTypes.DATE:
                return moment(value).format("YYYY-MM-DD");
            case ColumnTypes.TIME:
                return moment(value).format("HH:mm:ss");
            case ColumnTypes.DATETIME:
                return moment(value).format("YYYY-MM-DD HH:mm:ss");
            case ColumnTypes.JSON:
                return JSON.stringify(value);
            case ColumnTypes.SIMPLE_ARRAY:
                return (value as any[])
                    .map(i => String(i))
                    .join(",");
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any {
        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value ? true : false;

            case ColumnTypes.DATE:
                if (value instanceof Date)
                    return value;

                return moment(value, "YYYY-MM-DD").toDate();

            case ColumnTypes.TIME:
                return moment(value, "HH:mm:ss").toDate();

            case ColumnTypes.DATETIME:
                if (value instanceof Date)
                    return value;

                return moment(value, "YYYY-MM-DD HH:mm:ss").toDate();

            case ColumnTypes.JSON:
                return JSON.parse(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return (value as string).split(",");
        }

        return value;
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];

        const builtParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string): string  => {
            const value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    builtParameters.push(v);
                    return "$" + builtParameters.length;
                }).join(", ");
            } else {
                builtParameters.push(value);
            }
            return "$" + builtParameters.length;
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, builtParameters];
    }

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return "\"" + columnName + "\"";
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return "\"" + aliasName + "\"";
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return "\"" + tableName + "\"";
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => this.escapeColumnName(key) + "=$" + (startIndex + index + 1));
    }

}