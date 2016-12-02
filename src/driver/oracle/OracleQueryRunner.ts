import {QueryRunner} from "../../query-runner/QueryRunner";
import {DatabaseConnection} from "../DatabaseConnection";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {Logger} from "../../logger/Logger";
import {OracleDriver} from "./OracleDriver";
import {DataTypeNotSupportedByDriverError} from "../error/DataTypeNotSupportedByDriverError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {QueryRunnerAlreadyReleasedError} from "../../query-runner/error/QueryRunnerAlreadyReleasedError";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";

/**
 * Runs queries on a single mysql database connection.
 */
export class OracleQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    protected isReleased = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected databaseConnection: DatabaseConnection,
                protected driver: OracleDriver,
                protected logger: Logger) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     * You cannot use this class's methods after its released.
     */
    release(): Promise<void> {
        if (this.databaseConnection.releaseCallback) {
            this.isReleased = true;
            return this.databaseConnection.releaseCallback();
        }

        return Promise.resolve();
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        await this.beginTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS query FROM information_schema.tables WHERE table_schema = '${this.dbName}'`;
            const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

            await this.query(disableForeignKeysCheckQuery);
            const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropQueries.map(query => this.query(query["query"])));
            await this.query(enableForeignKeysCheckQuery);

            await this.commitTransaction();

        } catch (error) {
            await this.rollbackTransaction();
            throw error;

        } finally {
            await this.release();
        }

    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.databaseConnection.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        // await this.query("START TRANSACTION");
        this.databaseConnection.isTransactionActive = true;
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.databaseConnection.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

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
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        this.logger.logQuery(query, parameters);
        return new Promise((ok, fail) => {
            const handler = (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query, parameters);
                    this.logger.logQueryError(err);
                    return fail(err);
                }

                ok(result.rows || result.outBinds);
            };
            const executionOptions = {
                autoCommit: this.databaseConnection.isTransactionActive ? false : true
            };
            this.databaseConnection.connection.execute(query, parameters || {}, executionOptions, handler);
        });
    }

    /**
     * Insert a new row with given values into given table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const keys = Object.keys(keyValues);
        const columns = keys.map(key => this.driver.escapeColumnName(key)).join(", ");
        const values = keys.map(key => ":" + key).join(", ");
        const parameters = keys.map(key => keyValues[key]);
        const insertSql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values})`;
        if (generatedColumn) {
            const sql2 = `declare lastId number; begin ${insertSql} returning "id" into lastId; dbms_output.enable; dbms_output.put_line(lastId); dbms_output.get_line(:ln, :st); end;`;
            const saveResult = await this.query(sql2, parameters.concat([
                { dir: this.driver.oracle.BIND_OUT, type: this.driver.oracle.STRING, maxSize: 32767 },
                { dir: this.driver.oracle.BIND_OUT, type: this.driver.oracle.NUMBER }
            ]));
            return parseInt(saveResult[0]);
        } else {
            return this.query(insertSql, parameters);
        }
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE ${this.driver.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, condition: string, parameters?: any[]): Promise<void>;

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral): Promise<void>;

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM ${this.driver.escapeTableName(tableName)} WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let sql = "";
        if (hasLevel) {
            sql =   `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant, level) ` +
                    `SELECT ancestor, ${newEntityId}, level + 1 FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                    `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql =   `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant) ` +
                    `SELECT ancestor, ${newEntityId} FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                    `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async loadSchemaTables(tableNames: string[], namingStrategy: NamingStrategyInterface): Promise<TableSchema[]> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql      = `SELECT TABLE_NAME FROM user_tables WHERE TABLE_NAME IN (${tableNamesString})`;
        const columnsSql     = `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE, IDENTITY_COLUMN FROM all_tab_cols WHERE TABLE_NAME IN (${tableNamesString})`;
        const indicesSql     = `SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = '${this.dbName}' AND INDEX_NAME != 'PRIMARY'`;
        const foreignKeysSql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${this.dbName}' AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        const uniqueKeysSql  = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = '${this.dbName}' AND CONSTRAINT_TYPE = 'UNIQUE'`;
        const constraintsSql = `SELECT cols.table_name, cols.column_name, cols.position, cons.constraint_type, cons.constraint_name
FROM all_constraints cons, all_cons_columns cols WHERE cols.table_name IN (${tableNamesString}) 
AND cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner ORDER BY cols.table_name, cols.position`;
        const [dbTables, dbColumns, /*dbIndices, dbForeignKeys, dbUniqueKeys, */constraints]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            // this.query(indicesSql),
            // this.query(foreignKeysSql),
            // this.query(uniqueKeysSql),
            this.query(constraintsSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return dbTables.map(dbTable => {
            const tableSchema = new TableSchema(dbTable["TABLE_NAME"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === tableSchema.name)
                .map(dbColumn => {
                    const isPrimary = !!constraints
                        .find(constraint => {
                            return  constraint["TABLE_NAME"] === tableSchema.name &&
                                    constraint["CONSTRAINT_TYPE"] === "P" &&
                                    constraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                        });

                    let columnType = dbColumn["DATA_TYPE"].toLowerCase();
                    if (dbColumn["DATA_TYPE"].toLowerCase() === "varchar2" && dbColumn["DATA_LENGTH"] !== null) {
                        columnType += "(" + dbColumn["DATA_LENGTH"] + ")";
                    } else if (dbColumn["DATA_PRECISION"] !== null && dbColumn["DATA_SCALE"] !== null) {
                        columnType += "(" + dbColumn["DATA_PRECISION"] + "," + dbColumn["DATA_SCALE"] + ")";
                    } else if (dbColumn["DATA_SCALE"] !== null) {
                        columnType += "(0," + dbColumn["DATA_SCALE"] + ")";
                    } else if (dbColumn["DATA_PRECISION"] !== null) {
                        columnType += "(" + dbColumn["DATA_PRECISION"] + ")";
                    }

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];
                    columnSchema.type = columnType;
                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["NULLABLE"] !== "N";
                    columnSchema.isPrimary = isPrimary;
                    columnSchema.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES"; // todo
                    columnSchema.comment = ""; // todo
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = constraints
                .filter(constraint => constraint["TABLE_NAME"] === tableSchema.name && constraint["CONSTRAINT_TYPE"] === "P")
                .map(constraint => new PrimaryKeySchema(constraint["CONSTRAINT_NAME"], constraint["COLUMN_NAME"]));

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = constraints
                .filter(constraint => constraint["TABLE_NAME"] === tableSchema.name && constraint["CONSTRAINT_TYPE"] === "R")
                .map(constraint => new ForeignKeySchema(constraint["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            console.log(tableSchema);

            // create index schemas from the loaded indices
            // tableSchema.indices = dbIndices
            //     .filter(dbIndex => {
            //         return  dbIndex["table_name"] === tableSchema.name &&
            //             (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
            //             (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
            //     })
            //     .map(dbIndex => dbIndex["INDEX_NAME"])
            //     .filter((value, index, self) => self.indexOf(value) === index) // unqiue
            //     .map(dbIndexName => {
            //         const columnNames = dbIndices
            //             .filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName)
            //             .map(dbIndex => dbIndex["COLUMN_NAME"]);
            //
            //         return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness */);
            //     });

            return tableSchema;
        });
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Creates a new column from the column metadata in the table.
     */
    async createColumns(tableSchema: TableSchema, columns: ColumnSchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const queries = columns.map(column => {
            const sql = `ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(column)}`;
            return this.query(sql);
        });
        await Promise.all(queries);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const updatePromises = changedColumns.map(async changedColumn => {

            if (changedColumn.newColumn.isGenerated !== changedColumn.oldColumn.isGenerated) {

                if (changedColumn.newColumn.isGenerated) {
                    if (tableSchema.primaryKeys.length > 0 && changedColumn.oldColumn.isPrimary) {
                        console.log(tableSchema.primaryKeys);
                        const dropPrimarySql = `ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "${tableSchema.primaryKeys[0].name}"`;
                        await this.query(dropPrimarySql);
                    }

                    // since modifying identity column is not supported yet, we need to recreate this column
                    const dropSql = `ALTER TABLE "${tableSchema.name}" DROP COLUMN "${changedColumn.newColumn.name}"`;
                    await this.query(dropSql);

                    const createSql = `ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(changedColumn.newColumn)}`;
                    await this.query(createSql);

                } else {
                    const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${changedColumn.newColumn.name}" DROP IDENTITY`;
                    await this.query(sql);

                }
            }

            if (changedColumn.newColumn.isNullable !== changedColumn.oldColumn.isNullable) {
                const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${changedColumn.newColumn.name}" ${changedColumn.newColumn.type} ${changedColumn.newColumn.isNullable ? "NULL" : "NOT NULL"}`;
                await this.query(sql);

            } else if (changedColumn.newColumn.type !== changedColumn.oldColumn.type) { // elseif is used because
                const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${changedColumn.newColumn.name}" ${changedColumn.newColumn.type}`;
                await this.query(sql);
            }
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(dbTable: TableSchema, columns: ColumnSchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const dropPromises = columns.map(column => {
            return this.query(`ALTER TABLE "${dbTable.name}" DROP COLUMN "${column.name}"`);
        });

        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => "\"" + primaryKey.columnName + "\"");
        console.log(dbTable.primaryKeys);
        if (dbTable.primaryKeys.length > 0 && dbTable.primaryKeys[0].name)
            await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT "${dbTable.primaryKeys[0].name}"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(dbTable: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const promises = foreignKeys.map(foreignKey => {
            const columnNames = foreignKey.columnNames.map(column => "\"" + column + "\"").join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "\"" + column + "\"").join(",");
            let sql = `ALTER TABLE "${dbTable.name}" ADD CONSTRAINT "${foreignKey.name}" ` +
                `FOREIGN KEY (${columnNames}) ` +
                `REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
            if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
            return this.query(sql);
        });

        await Promise.all(promises);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchema: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const promises = foreignKeys.map(foreignKey => {
            const sql = `ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "${foreignKey.name}"`;
            return this.query(sql);
        });

        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(index: IndexSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columns = index.columnNames.map(columnName => "\"" + columnName + "\"").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX "${index.name}" ON "${index.tableName}"(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const sql = `ALTER TABLE "${tableName}" DROP INDEX "${indexName}"`;
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata) {
        switch (column.normalizedDataType) {
            case "string":
                return "varchar2(" + (column.length ? column.length : 255) + ")";
            case "text":
                return "clob";
            case "boolean":
                return "number(1)";
            case "integer":
            case "int":
                // if (column.isGenerated)
                //     return `number(22)`;
                if (column.precision && column.scale)
                    return `number(${column.precision},${column.scale})`;
                if (column.precision)
                    return `number(${column.precision},0)`;
                if (column.scale)
                    return `number(0,${column.scale})`;

                return "number(10,0)";
            case "smallint":
                return "number(5)";
            case "bigint":
                return "number(20)";
            case "float":
                if (column.precision && column.scale)
                    return `float(${column.precision},${column.scale})`;
                if (column.precision)
                    return `float(${column.precision},0)`;
                if (column.scale)
                    return `float(0,${column.scale})`;

                return `float(126)`;
            case "double":
            case "number":
                return "float(126)";
            case "decimal":
                if (column.precision && column.scale) {
                    return `decimal(${column.precision},${column.scale})`;

                } else if (column.scale) {
                    return `decimal(0,${column.scale})`;

                } else if (column.precision) {
                    return `decimal(${column.precision})`;

                } else {
                    return "decimal";
                }
            case "date":
                return "date";
            case "time":
                return "date";
            case "datetime":
                return "timestamp(0)";
            case "json":
                return "clob";
            case "simple_array":
                return column.length ? "varchar2(" + column.length + ")" : "text";
        }

        throw new DataTypeNotSupportedByDriverError(column.type, "Oracle");
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Database name shortcut.
     */
    protected get dbName(): string {
        return this.driver.options.database as string;
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map(key => this.driver.escapeColumnName(key) + "=:" + key);
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema) {
        let c = `"${column.name}" ` + column.type;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        // if (column.isPrimary === true && addPrimary)
        //     c += " PRIMARY KEY";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " GENERATED BY DEFAULT ON NULL AS IDENTITY";
        // if (column.comment) // todo: less priority, fix it later
        //     c += " COMMENT '" + column.comment + "'";
        if (column.default)
            c += " DEFAULT '" + column.default + "'";
        return c;
    }


}