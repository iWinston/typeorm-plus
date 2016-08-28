import {QueryRunner} from "../QueryRunner";
import * as moment from "moment";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Logger} from "../../logger/Logger";
import {DatabaseConnection} from "../DatabaseConnection";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {PostgresDriver} from "./PostgresDriver";

export class PostgresQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected databaseConnection: DatabaseConnection,
                protected driver: PostgresDriver,
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
     * Checks if transaction is in progress.
     */
    isTransactionActive(): boolean {
        return this.databaseConnection.isTransactionActive;
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
        const columns = keys.map(key => this.driver.escapeColumnName(key)).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values}) ${ idColumnName ? " RETURNING " + this.driver.escapeColumnName(idColumnName) : "" }`;
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
        const query = `UPDATE ${this.driver.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
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
            sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant, level) ` +
                `SELECT ancestor, ${newEntityId}, level + 1 FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant) ` +
                `SELECT ancestor, ${newEntityId} FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => this.driver.escapeColumnName(key) + "=$" + (startIndex + index + 1));
    }

}