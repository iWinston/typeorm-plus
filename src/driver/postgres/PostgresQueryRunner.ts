import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Logger} from "../../logger/Logger";
import {DatabaseConnection} from "../DatabaseConnection";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {PostgresDriver} from "./PostgresDriver";
import {DataTypeNotSupportedByDriverError} from "../error/DataTypeNotSupportedByDriverError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {QueryRunnerAlreadyReleasedError} from "../../query-runner/error/QueryRunnerAlreadyReleasedError";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";

/**
 * Runs queries on a single postgres database connection.
 */
export class PostgresQueryRunner implements QueryRunner {

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
            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as query FROM pg_tables WHERE schemaname = 'public'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));

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

        this.databaseConnection.isTransactionActive = true;
        await this.query("START TRANSACTION");
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

        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        this.logger.logQuery(query, parameters);
        return new Promise<any[]>((ok, fail) => {
            this.databaseConnection.connection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query, parameters);
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
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const keys = Object.keys(keyValues);
        const columns = keys.map(key => this.driver.escapeColumnName(key)).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const sql = columns.length > 0
            ? `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values}) ${ generatedColumn ? " RETURNING " + this.driver.escapeColumnName(generatedColumn.name) : "" }`
            : `INSERT INTO ${this.driver.escapeTableName(tableName)} DEFAULT VALUES ${ generatedColumn ? " RETURNING " + this.driver.escapeColumnName(generatedColumn.name) : "" }`;
        const parameters = keys.map(key => keyValues[key]);
        const result: ObjectLiteral[] = await this.query(sql, parameters);
        if (generatedColumn)
            return result[0][generatedColumn.name];

        return result;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

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
     * Inserts rows into closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

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
        const tablesSql      = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = 'public'`;
        const columnsSql     = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = 'public'`;
        const indicesSql     = `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name  FROM pg_class t, pg_class i, pg_index ix, pg_attribute a
WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid
AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname IN (${tableNamesString}) ORDER BY t.relname, i.relname`;
        const foreignKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'FOREIGN KEY'`;
        const uniqueKeysSql  = `SELECT * FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'UNIQUE'`;
        const primaryKeysSql = `SELECT c.column_name, tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
where constraint_type = 'PRIMARY KEY' and tc.table_catalog = '${this.dbName}'`;
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
            const tableSchema = new TableSchema(dbTable["table_name"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["table_name"] === tableSchema.name)
                .map(dbColumn => {
                    const columnType = dbColumn["data_type"].toLowerCase() + (dbColumn["character_maximum_length"] !== undefined && dbColumn["character_maximum_length"] !== null ? ("(" + dbColumn["character_maximum_length"] + ")") : "");
                    const isGenerated = dbColumn["column_default"] === `nextval('${dbColumn["table_name"]}_id_seq'::regclass)` || dbColumn["column_default"] === `nextval('"${dbColumn["table_name"]}_id_seq"'::regclass)`;

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["column_name"];
                    columnSchema.type = columnType;
                    columnSchema.default = dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined ? dbColumn["column_default"] : undefined;
                    columnSchema.isNullable = dbColumn["is_nullable"] === "YES";
                    // columnSchema.isPrimary = dbColumn["column_key"].indexOf("PRI") !== -1;
                    columnSchema.isGenerated = isGenerated;
                    columnSchema.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    columnSchema.isUnique = !!dbUniqueKeys.find(key => key["constraint_name"] === "uk_" + dbColumn["column_name"]);
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = primaryKeys
                .filter(primaryKey => primaryKey["table_name"] === tableSchema.name)
                .map(primaryKey => new PrimaryKeySchema(primaryKey["constraint_name"], primaryKey["column_name"]));

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["table_name"] === tableSchema.name)
                .map(dbForeignKey => new ForeignKeySchema(dbForeignKey["constraint_name"], [], [], "", "")); // todo: fix missing params

            // create unique key schemas from the loaded indices
            /*tableSchema.uniqueKeys = dbUniqueKeys
                .filter(dbUniqueKey => dbUniqueKey["table_name"] === tableSchema.name)
                .map(dbUniqueKey => {
                    return new UniqueKeySchema(dbUniqueKey["TABLE_NAME"], dbUniqueKey["CONSTRAINT_NAME"], [/!* todo *!/]);
                });*/

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return dbIndex["table_name"] === tableSchema.name &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["index_name"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["index_name"])) &&
                        (!dbUniqueKeys.find(key => key["constraint_name"] === dbIndex["index_name"]));
                })
                .map(dbIndex => dbIndex["index_name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["table_name"] === tableSchema.name && dbIndex["index_name"] === dbIndexName)
                        .map(dbIndex => dbIndex["column_name"]);

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
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        sql += table.columns
            .filter(column => column.isUnique)
            .map(column => `, CONSTRAINT "uk_${column.name}" UNIQUE ("${column.name}")`)
            .join(" ");
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
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
            const sql = `ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(column, false)}`;
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
            const oldColumn = changedColumn.oldColumn;
            const newColumn = changedColumn.newColumn;

            if (oldColumn.type !== newColumn.type ||
                oldColumn.name !== newColumn.name) {

                let sql = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}"`;
                if (oldColumn.type !== newColumn.type) {
                    sql += ` TYPE ${newColumn.type}`;
                }
                if (oldColumn.name !== newColumn.name) { // todo: make rename in a separate query too
                    sql += ` RENAME TO ` + newColumn.name;
                }
                await this.query(sql);
            }

            if (oldColumn.isNullable !== newColumn.isNullable) {
                let sql = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}"`;
                if (newColumn.isNullable) {
                    sql += ` DROP NOT NULL`;
                } else {
                    sql += ` SET NOT NULL`;
                }
                await this.query(sql);
            }

            // update sequence generation
            if (oldColumn.isGenerated !== newColumn.isGenerated) {
                if (!oldColumn.isGenerated) {
                    await this.query(`CREATE SEQUENCE "${tableSchema.name}_id_seq" OWNED BY "${tableSchema.name}"."${oldColumn.name}"`);
                    await this.query(`ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}" SET DEFAULT nextval('"${tableSchema.name}_id_seq"')`);
                } else {
                    await this.query(`ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}" DROP DEFAULT`);
                    await this.query(`DROP SEQUENCE "${tableSchema.name}_id_seq"`);
                }
            }

            if (oldColumn.comment !== newColumn.comment) {
                await this.query(`COMMENT ON COLUMN "${tableSchema.name}"."${oldColumn.name}" is '${newColumn.comment}'`);
            }

            if (oldColumn.isUnique !== newColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    await this.query(`ALTER TABLE "${tableSchema.name}" ADD CONSTRAINT "uk_${newColumn.name}" UNIQUE ("${newColumn.name}")`);

                } else if (newColumn.isUnique === false) {
                    await this.query(`ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "uk_${newColumn.name}"`);

                }
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
            return this.query(`ALTER TABLE "${dbTable.name}" DROP "${column.name}"`);
        });

        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => `"${primaryKey.columnName}"`);
        await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT IF EXISTS "${dbTable.name}_pkey"`);
        await this.query(`DROP INDEX IF EXISTS "${dbTable.name}_pkey"`);
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
            let sql = `ALTER TABLE "${dbTable.name}" ADD CONSTRAINT "${foreignKey.name}" ` +
                `FOREIGN KEY ("${foreignKey.columnNames.join("\", \"")}") ` +
                `REFERENCES "${foreignKey.referencedTableName}"("${foreignKey.referencedColumnNames.join("\", \"")}")`;
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

        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${index.tableName}"(${columnNames})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (isGenerated) {
            await this.query(`ALTER SEQUENCE "${tableName}_id_seq" OWNED BY NONE`);
        }

        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${indexName}"`; // todo: make sure DROP INDEX should not be used here
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata): string {
        switch (column.normalizedDataType) {
            case "string":
                return "character varying(" + (column.length ? column.length : 255) + ")";
            case "text":
                return "text";
            case "boolean":
                return "boolean";
            case "integer":
            case "int":
                return "integer";
            case "smallint":
                return "smallint";
            case "bigint":
                return "bigint";
            case "float":
                return "real";
            case "double":
            case "number":
                return "double precision";
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
                if (column.timezone) {
                    return "time with time zone";
                } else {
                    return "time without time zone";
                }
            case "datetime":
                if (column.timezone) {
                    return "timestamp with time zone";
                } else {
                    return "timestamp without time zone";
                }
            case "json":
                return "json";
            case "simple_array":
                return column.length ? "character varying(" + column.length + ")" : "text";
        }

        throw new DataTypeNotSupportedByDriverError(column.type, "Postgres");
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
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => this.driver.escapeColumnName(key) + "=$" + (startIndex + index + 1));
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema, skipPrimary: boolean) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " SERIAL";
        if (!column.isGenerated)
            c += " " + column.type;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated)
            c += " PRIMARY KEY";
        if (column.default)
            c += " DEFAULT '" + column.default + "'";
        return c;
    }

}