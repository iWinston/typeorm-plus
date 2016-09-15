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

        const allTablesSql = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
        const allTablesResults: ObjectLiteral[] = await this.query(allTablesSql);
        const tableNames = allTablesResults.map(result => result["TABLE_NAME"]);
        await Promise.all(tableNames.map(async tableName => {
            const dropForeignKeySql = `SELECT 'ALTER TABLE ' +  OBJECT_SCHEMA_NAME(parent_object_id) + '.[' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT ' + name as query FROM sys.foreign_keys WHERE referenced_object_id = object_id('${tableName}')`;
            const dropFkQueries: ObjectLiteral[] = await this.query(dropForeignKeySql);
            return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => {
                return this.query(dropQuery);
            }));
        }));
        await Promise.all(tableNames.map(tableName => {
            const dropTableSql = `DROP TABLE "${tableName}"`;
            return this.query(dropTableSql);
        }));

        // const selectDropsQuery = `SELECT 'DROP TABLE "' + TABLE_NAME + '"' as query FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';`;
        // const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
        // const allQueries = [`EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"`]
        //     .concat(dropQueries.map(q => this.query(q["query"])).join("; "));
        //
        // return new Promise<void>((ok, fail) => {
        //
        //     const request = new this.driver.mssql.Request(this.isTransactionActive() ? this.databaseConnection.transaction : this.databaseConnection.connection);
        //     request.multiple = true;
        //     request.query(allQueries, (err: any, result: any) => {
        //         if (err) {
        //             this.logger.logFailedQuery(allQueries);
        //             this.logger.logQueryError(err);
        //             return fail(err);
        //         }
        //
        //         ok();
        //     });
        // });

        // const selectDropsQuery = `SELECT 'DROP TABLE "' + TABLE_NAME + '";' as query FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';`;
        // const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
        // await this.query(`EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"`);
        // await Promise.all(dropQueries.map(q => this.query(q["query"])));
        // await this.query(`EXEC sp_msforeachtable 'drop table [?]'`);
    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.databaseConnection.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.isTransactionActive = true;
            this.databaseConnection.transaction.begin((err: any) => {
                if (err) {
                    this.databaseConnection.isTransactionActive = false;
                    return fail(err);
                }
                ok();
            });
        });
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.transaction.commit((err: any) => {
                if (err) return fail(err);
                this.databaseConnection.isTransactionActive = false;
                ok();
            });
        });
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.transaction.rollback((err: any) => {
                if (err) return fail(err);
                this.databaseConnection.isTransactionActive = false;
                ok();
            });
        });
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

            const request = new this.driver.mssql.Request(this.isTransactionActive() ? this.databaseConnection.transaction : this.databaseConnection.connection);
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    request.input(index, parameters![index]);
                });
            }
            request.query(query, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query);
                    this.logger.logQueryError(err);
                    return fail(err);
                }

                // console.log("result: ", result);
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
        const values = keys.map((key, index) => "@" + index).join(",");
        const parameters = keys.map(key => keyValues[key]);
        const sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) ${ generatedColumn ? "OUTPUT INSERTED." + generatedColumn.name + " " : "" }VALUES (${values})`;
        const result = await this.query(sql, parameters);
        return generatedColumn ? result instanceof Array ? result[0][generatedColumn.name] : result[generatedColumn.name] : undefined;
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
        const tablesSql          = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = '${this.dbName}'`;
        const columnsSql         = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.dbName}'`;
        const constraintsSql     = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages ` +
`LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME ` +
`WHERE columnUsages.TABLE_CATALOG = '${this.dbName}' AND tableConstraints.TABLE_CATALOG = '${this.dbName}'`;
        const identityColumnsSql = `SELECT COLUMN_NAME, TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.dbName}' AND COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1;`;
        const indicesSql         = `SELECT TABLE_NAME = t.name, INDEX_NAME = ind.name, IndexId = ind.index_id, ColumnId = ic.index_column_id, COLUMN_NAME = col.name, ind.*, ic.*, col.* ` +
`FROM sys.indexes ind INNER JOIN sys.index_columns ic ON  ind.object_id = ic.object_id and ind.index_id = ic.index_id INNER JOIN sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id ` +
`INNER JOIN sys.tables t ON ind.object_id = t.object_id WHERE ind.is_primary_key = 0 AND ind.is_unique = 0 AND ind.is_unique_constraint = 0 AND t.is_ms_shipped = 0 ORDER BY t.name, ind.name, ind.index_id, ic.index_column_id`;
        const [dbTables, dbColumns, dbConstraints, dbIdentityColumns, dbIndices]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(identityColumnsSql),
            this.query(indicesSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const tableSchema = new TableSchema(dbTable["TABLE_NAME"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === tableSchema.name)
                .map(dbColumn => {

                    const isPrimary = !!dbConstraints.find(dbConstraint => {
                        return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                                dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] &&
                                dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
                    });
                    const isGenerated = !!dbIdentityColumns.find(column => {
                        return  column["TABLE_NAME"] === tableSchema.name &&
                                column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });
                    const isUnique = !!dbConstraints.find(dbConstraint => {
                        return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                                dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] &&
                                dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
                    });

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];
                    columnSchema.type = dbColumn["DATA_TYPE"].toLowerCase() + (dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? "(" + dbColumn["CHARACTER_MAXIMUM_LENGTH"] + ")" : ""); // todo: use normalize type?
                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    columnSchema.isPrimary = isPrimary;
                    columnSchema.isGenerated = isGenerated;
                    columnSchema.isUnique = isUnique;
                    columnSchema.comment = ""; // todo: less priority, implement this later
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = dbConstraints
                .filter(dbConstraint => {
                    return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                            dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
                })
                .map(keyColumnUsage => {
                    return new PrimaryKeySchema(keyColumnUsage["CONSTRAINT_NAME"], keyColumnUsage["COLUMN_NAME"]);
                });

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbConstraints
                .filter(dbConstraint => {
                    return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                            dbConstraint["CONSTRAINT_TYPE"] === "FOREIGN KEY";
                })
                .map(dbConstraint => new ForeignKeySchema(dbConstraint["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["TABLE_NAME"] === tableSchema.name &&
                            (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                            (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName)
                        .map(dbIndex => dbIndex["COLUMN_NAME"]);

                    return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness? */);
                });

            return tableSchema;
        }));
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
            const oldColumn = changedColumn.oldColumn;
            const newColumn = changedColumn.newColumn;

            // to update an identy column we have to drop column and recreate it again
            if (newColumn.isGenerated !== oldColumn.isGenerated) {
                await this.query(`ALTER TABLE "${tableSchema.name}" DROP COLUMN "${newColumn.name}"`);
                await this.query(`ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(newColumn)}`);
            }

            const sql = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN ${this.buildCreateColumnSql(newColumn, true)}`; // todo: CHANGE OR MODIFY COLUMN ????
            await this.query(sql);

            if (newColumn.isUnique !== oldColumn.isUnique) {
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

        const oldPrimaryKeySql = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages
LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME AND tableConstraints.CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE columnUsages.TABLE_CATALOG = '${this.dbName}' AND tableConstraints.TABLE_CATALOG = '${this.dbName}'`;
        const oldPrimaryKey = await this.query(oldPrimaryKeySql);
        if (oldPrimaryKey.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`);

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => `"` + primaryKey.columnName + `"`);
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
            const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
            let sql =   `ALTER TABLE "${dbTable.name}" ADD CONSTRAINT "${foreignKey.name}" ` +
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

        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${index.tableName}"(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const sql = `DROP INDEX "${tableName}"."${indexName}"`;
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata) {
        switch (column.normalizedDataType) {
            case "string":
                return "nvarchar(" + (column.length ? column.length : 255) + ")";
            case "text":
                return "ntext";
            case "boolean":
                return "bit";
            case "integer":
            case "int":
                return "int";
            case "smallint":
                return "smallint";
            case "bigint":
                return "bigint";
            case "float":
                return "float";
            case "double":
            case "number":
                return "real";
            case "decimal":
                // if (column.precision && column.scale) {
                //     return `decimal(${column.precision},${column.scale})`;
                //
                // } else if (column.scale) {
                //     return `decimal(${column.scale})`;
                //
                // } else if (column.precision) {
                //     return `decimal(${column.precision})`;
                //
                // } else {
                    return "decimal";
                // }
            case "date":
                return "date";
            case "time":
                return "time";
            case "datetime":
                return "datetime";
            case "json":
                return "text";
            case "simple_array":
                return column.length ? "nvarchar(" + column.length + ")" : "text";
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
        return Object.keys(objectLiteral).map((key, index) => this.driver.escapeColumnName(key) + "=@" + index);
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema, skipIdentity: boolean = false) {
        let c = `"${column.name}" ${column.type}`;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated === true && !skipIdentity) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " IDENTITY(1,1)";
        // if (column.isPrimary === true && !skipPrimary)
        //     c += " PRIMARY KEY";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        return c;
    }


}