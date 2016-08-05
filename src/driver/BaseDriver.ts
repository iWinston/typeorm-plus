import {DriverOptions} from "./DriverOptions";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import * as moment from "moment";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Provides base functionality for all driver implementations.
 */
export abstract class BaseDriver {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    abstract connectionOptions: DriverOptions;

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    private transactionActive: boolean = false;
    
    // -------------------------------------------------------------------------
    // Abstract Protected Methods
    // -------------------------------------------------------------------------

    protected abstract checkIfConnectionSet(): void;

    // -------------------------------------------------------------------------
    // Abstract Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes a given SQL query and returns raw database results.
     */
    abstract query<T>(query: string, parameters?: any[]): Promise<T>;

    /**
     * Escapes given value.
     */
    abstract escape(value: any): any;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Updates rows that match given conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void> {
        this.checkIfConnectionSet();

        const updateValues = this.escapeObjectMap(valuesMap).join(",");
        const conditionString = this.escapeObjectMap(conditions).join(" AND ");
        const query = `UPDATE ${tableName} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        // console.log("executing update: ", query);
        return this.query(query).then(() => {});
    }

    protected escapeObjectMap(objectMap: ObjectLiteral): string[] {
        return Object.keys(objectMap).map(key => {
            const value = (<any> objectMap)[key];
            if (value === null || value === undefined) {
                return key + "=NULL";
            } else {
                return key + "=" + this.escape(value);
            }
        });
    }

    /**
     * Insert a new row into given table.
     */
    insert(tableName: string, keyValues: Object, idColumnName?: string): Promise<any> {
        this.checkIfConnectionSet();

        const columns = Object.keys(keyValues).join(",");
        const values  = Object.keys(keyValues).map(key => this.escape((<any> keyValues)[key])).join(","); // todo: escape here
        const query   = `INSERT INTO ${tableName}(${columns}) VALUES (${values})`;
        return this.query<any>(query).then(result => result.insertId);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    delete(tableName: string, conditions: Object): Promise<void> {
        this.checkIfConnectionSet();

        const conditionString = this.escapeObjectMap(conditions).join(" AND ");
        const query = `DELETE FROM ${tableName} WHERE ${conditionString}`;
        return this.query(query).then(() => {});
    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        this.transactionActive = true;
        await this.query("START TRANSACTION");
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        this.transactionActive = false;
        await this.query("COMMIT");
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        this.transactionActive = false;
        await this.query("ROLLBACK");
    }

    /**
     * Checks if transaction is active.
     */
    isTransactionActive() {
        return this.transactionActive;
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
                return (value as Array<any>)
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
     * Inserts rows into closure table.
     */
    insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${tableName}(ancestor, descendant, level) ` +
                `SELECT ancestor, ${newEntityId}, level + 1 FROM ${tableName} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${tableName}(ancestor, descendant) ` +
                `SELECT ancestor, ${newEntityId} FROM ${tableName} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        return this.query(sql).then(() => {
            return this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);

        }).then((results: any) => {
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected logQuery(query: string) {
        if (this.connectionOptions.logging && this.connectionOptions.logging.logQueries)
            this.log("executing query: " + query, "log");
    }

    protected logQueryError(error: any) {
        if (this.connectionOptions.logging && this.connectionOptions.logging.logFailedQueryError) {
            this.log("error during executing query:", "error");
            this.log(error, "error");
        }
    }

    protected logFailedQuery(query: string) {
        if (this.connectionOptions.logging &&
            (this.connectionOptions.logging.logQueries || this.connectionOptions.logging.logOnlyFailedQueries))
            this.log("query failed: " + query, "error");
    }

    protected log(message: any, level: "log"|"debug"|"info"|"error") {
        if (!this.connectionOptions.logging) return;
        if (this.connectionOptions && this.connectionOptions.logging && this.connectionOptions.logging.logger) {
            this.connectionOptions.logging.logger(message, level);
        } else {
            switch (level) {
                case "log":
                    console.log(message);
                    break;
                case "debug":
                    console.debug(message);
                    break;
                case "info":
                    console.info(message);
                    break;
                case "error":
                    console.error(message);
                    break;
            }
        }
    }

}