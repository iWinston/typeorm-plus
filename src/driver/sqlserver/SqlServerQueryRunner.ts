import {QueryRunner} from "../QueryRunner";
import {DatabaseConnection} from "../DatabaseConnection";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {Logger} from "../../logger/Logger";
import {SqlServerDriver} from "./SqlServerDriver";
import {DataTypeNotSupportedByDriverError} from "../error/DataTypeNotSupportedByDriverError";
import {ColumnSchema} from "../../schema-builder/database-schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/database-schema/TableSchema";
import {ForeignKeySchema} from "../../schema-builder/database-schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/database-schema/PrimaryKeySchema";
import {IndexSchema} from "../../schema-builder/database-schema/IndexSchema";
import {QueryRunnerAlreadyReleasedError} from "../error/QueryRunnerAlreadyReleasedError";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";

/**
 * Runs queries on a single mysql database connection.
 */
export class SqlServerQueryRunner implements QueryRunner {

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
                protected driver: SqlServerDriver,
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

        const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
        const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS query FROM information_schema.tables WHERE table_schema = '${this.dbName}'`;
        const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

        await this.query(disableForeignKeysCheckQuery);
        const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
        await Promise.all(dropQueries.map(query => this.query(query["query"])));
        await this.query(enableForeignKeysCheckQuery);
    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.databaseConnection.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        await this.query("START TRANSACTION");
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

        this.logger.logQuery(query);
        return new Promise((ok, fail) => {
            this.databaseConnection.connection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query);
                    this.logger.logQueryError(err);
                    return fail(err);
                }

                ok(result);
            });
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
        const values = keys.map(key => "?").join(",");
        const parameters = keys.map(key => keyValues[key]);
        const sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values})`;
        const result = await this.query(sql, parameters);
        return generatedColumn ? result.insertId : undefined;
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
    async delete(tableName: string, conditions: ObjectLiteral): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `DELETE FROM ${this.driver.escapeTableName(tableName)} WHERE ${conditionString}`;
        const parameters = Object.keys(conditions).map(key => conditions[key]);
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

        if (!tableNames)
            return [];

        // load tables, columns, indices and foreign keys
        const tablesSql      = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${this.dbName}'`;
        const columnsSql     = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.dbName}'`;
        const indicesSql     = `SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = '${this.dbName}' AND INDEX_NAME != 'PRIMARY'`;
        const foreignKeysSql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${this.dbName}' AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        const uniqueKeysSql  = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = '${this.dbName}' AND CONSTRAINT_TYPE = 'UNIQUE'`;
        const primaryKeysSql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = '${this.dbName}' AND CONSTRAINT_TYPE = 'PRIMARY KEY'`;
        const [dbTables, dbColumns, dbIndices, dbForeignKeys, dbUniqueKeys, primaryKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
            this.query(uniqueKeysSql),
            this.query(primaryKeysSql),
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
                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];
                    columnSchema.type = dbColumn["COLUMN_TYPE"].toLowerCase(); // todo: use normalize type?
                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    columnSchema.isPrimary = dbColumn["COLUMN_KEY"].indexOf("PRI") !== -1;
                    columnSchema.isGenerated = dbColumn["EXTRA"].indexOf("auto_increment") !== -1;
                    columnSchema.comment = dbColumn["COLUMN_COMMENT"];
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = primaryKeys
                .filter(primaryKey => primaryKey["TABLE_NAME"] === tableSchema.name)
                .map(primaryKey => new PrimaryKeySchema(primaryKey["CONSTRAINT_NAME"], primaryKey["COLUMN_NAME"]));

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["TABLE_NAME"] === tableSchema.name)
                .map(dbForeignKey => new ForeignKeySchema(dbForeignKey["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["table_name"] === tableSchema.name &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName)
                        .map(dbIndex => dbIndex["COLUMN_NAME"]);

                    return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness */);
                });

            return tableSchema;
        });
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        let sql = `CREATE TABLE \`${table.name}\` (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `\`${column.name}\``).join(", ")})`;
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
            const sql = `ALTER TABLE \`${tableSchema.name}\` ADD ${this.buildCreateColumnSql(column, false)}`;
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

        const updatePromises = changedColumns.map(changedColumn => {
            const sql = `ALTER TABLE \`${tableSchema.name}\` CHANGE \`${changedColumn.oldColumn.name}\` ${this.buildCreateColumnSql(changedColumn.newColumn, changedColumn.oldColumn.isPrimary)}`; // todo: CHANGE OR MODIFY COLUMN ????
            return this.query(sql);
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
            return this.query(`ALTER TABLE \`${dbTable.name}\` DROP \`${column.name}\``);
        });

        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => "`" + primaryKey.columnName + "`");
        await this.query(`ALTER TABLE ${dbTable.name} DROP PRIMARY KEY`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE ${dbTable.name} ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(dbTable: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const promises = foreignKeys.map(foreignKey => {
            const columnNames = foreignKey.columnNames.map(column => "`" + column + "`").join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "`" + column + "`").join(",");
            let sql =   `ALTER TABLE ${dbTable.name} ADD CONSTRAINT \`${foreignKey.name}\` ` +
                `FOREIGN KEY (${columnNames}) ` +
                `REFERENCES \`${foreignKey.referencedTableName}\`(${referencedColumnNames})`;
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
            const sql = `ALTER TABLE \`${tableSchema.name}\` DROP FOREIGN KEY \`${foreignKey.name}\``;
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

        const columns = index.columnNames.map(columnName => "`" + columnName + "`").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX \`${index.name}\` ON \`${index.tableName}\`(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const sql = `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``;
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata) {
        switch (column.normalizedDataType) {
            case "string":
                return "varchar(" + (column.length ? column.length : 255) + ")";
            case "text":
                return "text";
            case "boolean":
                return "tinyint(1)";
            case "integer":
            case "int":
                return "int(" + (column.length ? column.length : 11) + ")";
            case "smallint":
                return "smallint(" + (column.length ? column.length : 11) + ")";
            case "bigint":
                return "bigint(" + (column.length ? column.length : 11) + ")";
            case "float":
                return "float";
            case "double":
            case "number":
                return "double";
            case "decimal":
                if (column.precision && column.scale) {
                    return `decimal(${column.precision},${column.scale})`;

                } else if (column.scale) {
                    return `decimal(${column.scale})`;

                } else if (column.precision) {
                    return `decimal(${column.precision})`;

                } else {
                    return "decimal";

                }
            case "date":
                return "date";
            case "time":
                return "time";
            case "datetime":
                return "datetime";
            case "json":
                return "text";
            case "simple_array":
                return column.length ? "varchar(" + column.length + ")" : "text";
        }

        throw new DataTypeNotSupportedByDriverError(column.type, "MySQL");
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
        return Object.keys(objectLiteral).map(key => this.driver.escapeColumnName(key) + "=?");
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema, skipPrimary: boolean) {
        let c = "`" + column.name + "` " + column.type;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isPrimary === true && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        return c;
    }


}