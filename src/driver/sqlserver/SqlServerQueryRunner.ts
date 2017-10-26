import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TablePrimaryKey} from "../../schema-builder/table/TablePrimaryKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {SqlServerDriver} from "./SqlServerDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {MssqlParameter} from "./MssqlParameter";
import {OrmUtils} from "../../util/OrmUtils";
import {QueryFailedError} from "../../error/QueryFailedError";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TablePrimaryKeyOptions} from "../../schema-builder/options/TablePrimaryKeyOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";

/**
 * Runs queries on a single mysql database connection.
 */
export class SqlServerQueryRunner extends BaseQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: SqlServerDriver;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Last executed query in a transaction.
     * This is needed because in transaction mode mssql cannot execute parallel queries,
     * that's why we store last executed query promise to wait it when we execute next query.
     *
     * @see https://github.com/patriksimek/node-mssql/issues/491
     */
    protected queryResponsibilityChain: Promise<any>[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqlServerDriver, mode: "master"|"slave" = "master") {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.mode = mode;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        return new Promise<void>(async (ok, fail) => {
            this.isTransactionActive = true;

            const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
            this.databaseConnection = pool.transaction();
            this.databaseConnection.begin((err: any) => {
                if (err) {
                    this.isTransactionActive = false;
                    return fail(err);
                }
                ok();
            });
        });
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.commit((err: any) => {
                if (err) return fail(err);
                this.isTransactionActive = false;
                this.databaseConnection = null;
                ok();
            });
        });
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.rollback((err: any) => {
                if (err) return fail(err);
                this.isTransactionActive = false;
                this.databaseConnection = null;
                ok();
            });
        });
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let waitingOkay: Function;
        const waitingPromise = new Promise((ok) => waitingOkay = ok);
        if (this.queryResponsibilityChain.length) {
            const otherWaitingPromises = [...this.queryResponsibilityChain];
            this.queryResponsibilityChain.push(waitingPromise);
            await Promise.all(otherWaitingPromises);
        }

        const promise = new Promise(async (ok, fail) => {
            try {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
                const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                if (parameters && parameters.length) {
                    parameters.forEach((parameter, index) => {
                        if (parameter instanceof MssqlParameter) {
                            const mssqlParameter = this.mssqlParameterToNativeParameter(parameter);
                            if (mssqlParameter) {
                                request.input(index, mssqlParameter, parameter.value);
                            } else {
                                request.input(index, parameter.value);
                            }
                        } else {
                            request.input(index, parameter);
                        }
                    });
                }
                const queryStartTime = +new Date();
                request.query(query, (err: any, result: any) => {

                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                    const resolveChain = () => {
                        if (promiseIndex !== -1)
                            this.queryResponsibilityChain.splice(promiseIndex, 1);
                        if (waitingPromiseIndex !== -1)
                            this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                        waitingOkay();
                    };

                    let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                    let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        resolveChain();
                        return fail(new QueryFailedError(query, parameters, err));
                    }

                    ok(result.recordset);
                    resolveChain();
                });

            } catch (err) {
                fail(err);
            }
        });
        if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);

        return promise;
    }

    /**
     * Returns raw data stream.
     */
    async stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let waitingOkay: Function;
        const waitingPromise = new Promise((ok) => waitingOkay = ok);
        if (this.queryResponsibilityChain.length) {
            const otherWaitingPromises = [...this.queryResponsibilityChain];
            this.queryResponsibilityChain.push(waitingPromise);
            await Promise.all(otherWaitingPromises);
        }

        const promise = new Promise<ReadStream>(async (ok, fail) => {

            this.driver.connection.logger.logQuery(query, parameters, this);
            const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
            const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
            request.stream = true;
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    if (parameter instanceof MssqlParameter) {
                        request.input(index, this.mssqlParameterToNativeParameter(parameter), parameter.value);
                    } else {
                        request.input(index, parameter);
                    }
                });
            }
            request.query(query, (err: any, result: any) => {

                const resolveChain = () => {
                    if (promiseIndex !== -1)
                        this.queryResponsibilityChain.splice(promiseIndex, 1);
                    if (waitingPromiseIndex !== -1)
                        this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                    waitingOkay();
                };

                let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                if (err) {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    resolveChain();
                    return fail(err);
                }

                ok(result.recordset);
                resolveChain();
            });
            if (onEnd) request.on("done", onEnd);
            if (onError) request.on("error", onError);
            ok(request as ReadStream);
        });
        if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);

        return promise;
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tablePath: string, keyValues: ObjectLiteral): Promise<any> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map((key, index) => "@" + index).join(",");
        const generatedColumns = this.connection.hasMetadata(tablePath) ? this.connection.getMetadata(tablePath).generatedColumns : [];
        const generatedColumnNames = generatedColumns.map(generatedColumn => `INSERTED."${generatedColumn.databaseName}"`).join(", ");
        const generatedColumnSql = generatedColumns.length > 0 ? ` OUTPUT ${generatedColumnNames}` : "";
        const sql = columns.length > 0
            ? `INSERT INTO ${this.escapeTableName(tablePath)}(${columns}) ${generatedColumnSql} VALUES (${values})`
            : `INSERT INTO ${this.escapeTableName(tablePath)} ${generatedColumnSql} DEFAULT VALUES `;

        const parameters = this.driver.parametrizeMap(tablePath, keyValues);
        const parametersArray = Object.keys(parameters).map(key => parameters[key]);
        const result = await this.query(sql, parametersArray);
        const generatedMap = generatedColumns.reduce((map, column) => {
            const valueMap = column.createValueMap(result[0][column.databaseName]);
            return OrmUtils.mergeDeep(map, valueMap);
        }, {} as ObjectLiteral);

        return {
            result: result,
            generatedMap: Object.keys(generatedMap).length > 0 ? generatedMap : undefined
        };
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tablePath: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        valuesMap = this.driver.parametrizeMap(tablePath, valuesMap);
        conditions = this.driver.parametrizeMap(tablePath, conditions);

        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, updateParams.length).join(" AND ");
        const sql = `UPDATE ${this.escapeTableName(tablePath)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;

        await this.query(sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tablePath: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        conditions = typeof conditions === "object" ? this.driver.parametrizeMap(tablePath, conditions) : conditions;
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM ${this.escapeTableName(tablePath)} WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) { // todo: escape all parameters there
            sql = `INSERT INTO ${this.escapeTableName(tablePath)}("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", ${newEntityId}, "level" + 1 FROM ${this.escapeTableName(tablePath)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${this.escapeTableName(tablePath)}("ancestor", "descendant") ` +
                `SELECT "ancestor", ${newEntityId} FROM ${this.escapeTableName(tablePath)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${this.escapeTableName(tablePath)} WHERE descendant = ${parentId}`);
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        } else {
            return -1;
        }
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        const result = await this.query(`EXEC sp_databases`) as any[];
        return result.map(db => db["DATABASE_NAME"]);
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        const query = database ? `SELECT * from ${database}.sys.schemas` : `SELECT * from sys.schemas`;
        const result = await this.query(query) as any[];
        return result.map(schema => schema["name"]);
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT DB_ID('${database}') as db_id`);
        const dbId = result[0]["db_id"];
        return !!dbId;
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(`SELECT SCHEMA_ID('${schema}') as schema_id`);
        const schemaId = result[0]["schema_id"];
        return !!schemaId;
    }

    // todo: escape everything everywhere

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM ${parsedTableName.database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${parsedTableName.schema}' AND TABLE_SCHEMA = '${parsedTableName.tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new database.
     */
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        const up = ifNotExist ? `IF DB_ID('${database}') IS NULL CREATE DATABASE ${database}` : `CREATE DATABASE ${database}`;
        const down = ifNotExist ? `IF DB_ID('${database}') IS NOT NULL DROP DATABASE ${database}` : `DROP DATABASE ${database}`;
        await this.executeQueries(up, down);
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const down = ifExist ? `IF DB_ID('${database}') IS NOT NULL DROP DATABASE ${database}` : `DROP DATABASE ${database}`;
        const up = ifExist ? `IF DB_ID('${database}') IS NULL CREATE DATABASE ${database}` : `CREATE DATABASE ${database}`;
        await this.executeQueries(up, down);
    }

    /**
     * Creates table schema.
     */
    async createSchema(schemaPath: string): Promise<void> {
        if (schemaPath.indexOf(".") === -1) {
            const query = `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC sp_executesql N'CREATE SCHEMA ${schemaPath}' END`;
            await this.query(query);
        } else {
            const dbName = schemaPath.split(".")[0];
            const schema = schemaPath.split(".")[1];
            const currentDB = await this.getCurrentDatabase();
            await this.query(`USE ${dbName}`);
            const query = `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC sp_executesql N'CREATE SCHEMA ${schema}' END`;
            await this.query(query);
            await this.query(`USE ${currentDB}`);
        }
    }

    /**
     * Creates a new table.
     */
    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        // if skipForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(table, index));
            });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops the table.
     *
     * todo: think to create options and move skips there
     */
    async dropTable(target: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {
        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query and vice versa
        const createForeignKeys: boolean = dropForeignKeys;
        const tableName = target instanceof Table ? target.name : target;
        const table = await this.getCachedTable(tableName);
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(table, index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        // if skipForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Renames the given table.
     */
    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        const oldTableName = oldTableOrName instanceof Table ? oldTableOrName.name : oldTableOrName;
        const newTableName = newTableOrName instanceof Table ? newTableOrName.name : newTableOrName;

        const up = `EXEC sp_rename '${this.escapeTableName(oldTableName, true)}', '${newTableName}'`;
        const down = `EXEC sp_rename '${this.escapeTableName(newTableName, true)}', '${oldTableName}'`;

        await this.executeQueries(up, down);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tablePath: string, columnName: string): Promise<boolean> {
        const parsedTablePath = this.parseTableName(tablePath);
        const sql = `SELECT * FROM ${parsedTablePath.database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${parsedTablePath.tableName}' AND COLUMN_NAME = '${columnName}' AND TABLE_SCHEMA = '${parsedTablePath.schema}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column, false, true)}`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);

        if (column.isPrimary) {
            // if table already have primary key, me must drop it and recreate again
            if (clonedTable.primaryKey) {
                const columnNames = clonedTable.primaryKey.columnNames.map(columnName => `"${columnName}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${clonedTable.primaryKey.name}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${clonedTable.primaryKey.name}" PRIMARY KEY (${columnNames})`);
                clonedTable.primaryKey.columnNames.push(column.name);
                clonedTable.primaryKey.name = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryKey.columnNames);

            } else {
                clonedTable.primaryKey = new TablePrimaryKey({
                    name: this.connection.namingStrategy.primaryKeyName(clonedTable.name, [column.name]),
                    columnNames: [column.name]
                });
            }

            const columnNames = clonedTable.primaryKey.columnNames.map(columnName => `"${columnName}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${clonedTable.primaryKey!.name}" PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${clonedTable.primaryKey!.name}"`);
        }

        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
               name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
               columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);
        }

        if (column.default !== null && column.default !== undefined) {
            const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${column.default} FOR "${column.name}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.addColumn(column);
        this.replaceCachedTable(clonedTable);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableOrName, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const oldColumnName = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName.name : oldTableColumnOrName;
        const newColumnName = newTableColumnOrName instanceof TableColumn ? newTableColumnOrName.name : newTableColumnOrName;

        const up = `EXEC sp_rename '${this.escapeTableName(tableName, true)}.${oldColumnName}', '${newColumnName}', 'COLUMN'`;
        const down = `EXEC sp_rename '${this.escapeTableName(tableName, true)}.${newColumnName}', '${oldColumnName}', 'COLUMN'`;

        await this.executeQueries(up, down);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        if (newColumn.isGenerated !== oldColumn.isGenerated) {
            throw new Error(`Changing column's "isGenerated" property is not supported. Drop column and recreate it with a new "isGenerated" property instead.`);

        } else {
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN ${this.buildCreateColumnSql(newColumn, true, false)}`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN ${this.buildCreateColumnSql(oldColumn, true, false)}`);

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                if (newColumn.isPrimary === true) {
                    if (table.primaryKey && clonedTable.primaryKey) {
                        const columnNames = table.primaryKey.columnNames.map(columnName => `"${columnName}"`).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${table.primaryKey.name}"`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${table.primaryKey.name}" PRIMARY KEY (${columnNames})`);

                        clonedTable.primaryKey.columnNames.push(newColumn.name);
                        clonedTable.primaryKey.name = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryKey.columnNames);

                    } else {
                        clonedTable.primaryKey = new TablePrimaryKey({
                            name: this.connection.namingStrategy.primaryKeyName(table.name, [newColumn.name]),
                            columnNames: [newColumn.name]
                        });
                    }

                    const columnNames = clonedTable.primaryKey!.columnNames.map(columnName => `"${columnName}"`).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${clonedTable.primaryKey!.name}" PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${clonedTable.primaryKey!.name}"`);

                } else if (newColumn.isPrimary === false) {
                    const existPrimaryColumn = table.primaryKey!.columnNames.find(columnName => columnName === newColumn.name);
                    clonedTable.primaryKey!.columnNames.splice(clonedTable.primaryKey!.columnNames.indexOf(existPrimaryColumn!), 1);

                    if (clonedTable.primaryKey!.columnNames.length === 0) {
                        clonedTable.primaryKey = undefined;
                    } else {
                        const columnNames = clonedTable.primaryKey!.columnNames.map(columnName => `"${columnName}"`).join(", ");
                        clonedTable.primaryKey!.name = this.connection.namingStrategy.primaryKeyName(table.name, clonedTable.primaryKey!.columnNames);
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${clonedTable.primaryKey!.name}" PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${clonedTable.primaryKey!.name}"`);
                    }
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                        columnNames: [newColumn.name]
                    });
                    clonedTable.uniques.push(uniqueConstraint);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);

                } else if (newColumn.isUnique === false) {
                    const uniqueConstraint = table.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint!.name}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`);
                }
            }

            if (newColumn.default !== oldColumn.default) {
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, newColumn.name);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT '${newColumn.default}' FOR "${newColumn.name}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, oldColumn.name);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT '${oldColumn.default}' FOR "${oldColumn.name}"`);
                }
            }
        }

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(clonedTable);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (clonedTable.primaryKey && clonedTable.primaryKey.columnNames.find(columnName => columnName === column.name)) {
            const columnNames = clonedTable.primaryKey.columnNames.map(columnName => `"${columnName}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${clonedTable.primaryKey.name}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${clonedTable.primaryKey.name}" PRIMARY KEY (${columnNames})`);
            clonedTable.primaryKey.columnNames.splice(clonedTable.primaryKey.columnNames.indexOf(column.name), 1);

            // if primary key have multiple columns, we must recreate it without dropped column
            if (clonedTable.primaryKey.columnNames.length > 0) {
                const columnNames = clonedTable.primaryKey.columnNames.map(columnName => `"${columnName}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${clonedTable.primaryKey.name}" PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${clonedTable.primaryKey.name}"`);
            }
        }

        if (column.isUnique) {
            const uniqueName = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
            const foundUnique = clonedTable.uniques.find(unique => unique.name === uniqueName);
            if (foundUnique)
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueName}" UNIQUE (${column.name})`);
        }

        if (column.default !== null && column.default !== undefined) {
            const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT '${column.default}' FOR "${column.name}"`);
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column, false, true)}`);

        await this.executeQueries(upQueries, downQueries);

        table.removeColumn(column);
        this.replaceCachedTable(clonedTable);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(tableOrName, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(table: Table): Promise<void> {
        const parsedTableName = this.parseTableName(table); // todo: selects must only be executed in getTables
        const oldPrimaryKeySql = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM ${parsedTableName.database}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages
LEFT JOIN ${parsedTableName.database}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME AND tableConstraints.CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE tableConstraints.TABLE_CATALOG = '${parsedTableName.database}' AND columnUsages.TABLE_SCHEMA = '${parsedTableName.schema}' AND tableConstraints.TABLE_SCHEMA = '${parsedTableName.schema}'`;

        const oldPrimaryKey = await this.query(oldPrimaryKeySql);
        if (oldPrimaryKey.length > 0) {
            // const up = `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`;
            // const down = ``;
            await this.query(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`);
        }

        if (!table.primaryKey)
            return Promise.resolve();
        const primaryColumnNames = table.primaryKey.columnNames.map(columnName => `"` + columnName + `"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.addForeignKey(foreignKey);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new Error(`Supplied foreign key does not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.removeForeignKey(foreignKey);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(table, index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new Error(`Supplied index does not found in table ${table.name}`);

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tablePath: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTableName(tablePath)}`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            let allTablesSql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
            const allTablesResults: ObjectLiteral[] = await this.query(allTablesSql);
            await Promise.all(allTablesResults.map(async tablesResult => {
                const dropForeignKeySql = `SELECT 'ALTER TABLE "' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + '"."' + OBJECT_NAME(fk.parent_object_id) + '" DROP CONSTRAINT "' + fk.name + '"' as query FROM sys.foreign_keys AS fk WHERE fk.referenced_object_id = object_id('"${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"')`;
                const dropFkQueries: ObjectLiteral[] = await this.query(dropForeignKeySql);
                return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => {
                    return this.query(dropQuery);
                }));
            }));
            await Promise.all(allTablesResults.map(tablesResult => {
                const dropTableSql = `DROP TABLE "${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"`;
                return this.query(dropTableSql);
            }));

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    /**
     * Removes all tables from the currently connected database.
     */
    /*async clearDatabase(schemas?: string[], database?: string): Promise<void> {
        const isDatabaseExist = await this.hasDatabase(database!);
        if (!isDatabaseExist)
            return Promise.resolve();

        if (!schemas)
            schemas = [];
        schemas.push(this.driver.options.schema || "SCHEMA_NAME()");
        const schemaNamesString = schemas.map(name => {
            return name === "SCHEMA_NAME()" ? name : "'" + name + "'";
        }).join(", ");

        await this.startTransaction();
        try {
            let allTablesSql = `SELECT * FROM ${database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA IN (${schemaNamesString})`;
            const allTablesResults: ObjectLiteral[] = await this.query(allTablesSql);
            await Promise.all(allTablesResults.map(async tablesResult => {
                const dropForeignKeySql = `SELECT 'ALTER TABLE "${database}"."' + OBJECT_SCHEMA_NAME(fk.parent_object_id, DB_ID('${database}')) + '"."' + OBJECT_NAME(fk.parent_object_id, DB_ID('${database}')) + '" DROP CONSTRAINT "' + fk.name + '"' as query FROM ${database}.sys.foreign_keys AS fk WHERE fk.referenced_object_id = object_id('"${database}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"')`;
                const dropFkQueries: ObjectLiteral[] = await this.query(dropForeignKeySql);
                return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => {
                    return this.query(dropQuery);
                }));
            }));
            await Promise.all(allTablesResults.map(tablesResult => {
                const dropTableSql = `DROP TABLE "${tablesResult["TABLE_CATALOG"]}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"`;
                return this.query(dropTableSql);
            }));

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }*/

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected async getCurrentDatabase(): Promise<string> {
        const currentDBQuery = await this.query(`SELECT DB_NAME() AS db_name`);
        return currentDBQuery[0]["db_name"];
    }

    protected async getCurrentSchema(): Promise<string> {
        const currentSchemaQuery = await this.query(`SELECT SCHEMA_NAME() AS schema_name`);
        return currentSchemaQuery[0]["schema_name"];
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tablePaths: string[]): Promise<Table[]> {

        // if no tables given then no need to proceed
        if (!tablePaths || !tablePaths.length)
            return [];

        const tableNames = tablePaths.map(tablePath => {
            if (tablePath.split(".").length === 3) {
                return tablePath.split(".")[2];
            } else if (tablePath.split(".").length === 2) {
                return tablePath.split(".")[1];
            } else {
                return tablePath;
            }
        });

        let schemaNames: string[] = [];
        const currentSchema = await this.getCurrentSchema();
        const currentDatabase = await this.getCurrentDatabase();

        tablePaths.filter(tablePath => tablePath.indexOf(".") !== -1)
            .forEach(tablePath => {
                if (tablePath.split(".").length === 3) {
                    if (tablePath.split(".")[1] !== "")
                        schemaNames.push(tablePath.split(".")[1]);
                } else {
                    schemaNames.push(tablePath.split(".")[0]);
                }
            });
        schemaNames.push(this.driver.options.schema || currentSchema);

        const dbNames = tablePaths
            .filter(tablePath => tablePath.split(".").length === 3)
            .map(tablePath => tablePath.split(".")[0]);
        if (this.driver.database && !dbNames.find(dbName => dbName === this.driver.database))
            dbNames.push(this.driver.database);

        // load tables, columns, indices and foreign keys
        const schemaNamesString = schemaNames.map(name => "'" + name + "'").join(", ");
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");

        const tablesSql = dbNames.map(dbName => {
            return `SELECT * FROM ${dbName}.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN (${tableNamesString}) AND TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const columnsSql = dbNames.map(dbName => {
            return `SELECT * FROM ${dbName}.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const constraintsSql = dbNames.map(dbName => {
            return `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM ${dbName}.INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE columnUsages ` +
                `LEFT JOIN ${dbName}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME ` +
                `WHERE columnUsages.TABLE_SCHEMA IN (${schemaNamesString}) AND tableConstraints.TABLE_SCHEMA IN (${schemaNamesString}) ` +
                `AND tableConstraints.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE')`;
        }).join(" UNION ALL ");

        const foreignKeysSql = dbNames.map(dbName => {
            return `SELECT '${dbName}' AS TABLE_CATALOG, fk.name AS FK_NAME, OBJECT_NAME(fk.parent_object_id, DB_ID('${dbName}')) AS TABLE_NAME, ` +
                `SCHEMA_NAME(fk.schema_id) AS TABLE_SCHEMA, col1.name AS COLUMN_NAME, OBJECT_SCHEMA_NAME(fk.referenced_object_id, DB_ID('${dbName}')) AS REF_SCHEMA, ` +
                `OBJECT_NAME(fk.referenced_object_id, DB_ID('${dbName}')) AS REF_TABLE, col2.name AS REF_COLUMN, fk.delete_referential_action_desc AS ON_DELETE, ` +
                `fk.update_referential_action_desc AS ON_UPDATE ` +
                `FROM ${dbName}.sys.foreign_keys fk ` +
                `INNER JOIN ${dbName}.sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id ` +
                `INNER JOIN ${dbName}.sys.objects obj ON obj.object_id = fk.object_id ` +
                `INNER JOIN ${dbName}.sys.columns col1 ON col1.column_id = fkc.parent_column_id AND col1.object_id = fk.parent_object_id ` +
                `INNER JOIN ${dbName}.sys.columns col2 ON col2.column_id = fkc.referenced_column_id AND col2.object_id = fk.referenced_object_id`;
        }).join(" UNION ALL ");

        const identityColumnsSql = dbNames.map(dbName => {
            return `SELECT TABLE_CATALOG, TABLE_SCHEMA, COLUMN_NAME, TABLE_NAME ` +
                `FROM ${dbName}.INFORMATION_SCHEMA.COLUMNS ` +
                `WHERE COLUMNPROPERTY(object_id(TABLE_CATALOG + '.' + TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1 AND TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const indicesSql = dbNames.map(dbName => {
            return `SELECT '${dbName}' AS TABLE_CATALOG, SCHEMA_NAME(t.schema_id) AS TABLE_SCHEMA, t.name AS TABLE_NAME, ` +
                `ind.name AS INDEX_NAME, col.name AS COLUMN_NAME, ind.is_unique AS IS_UNIQUE ` +
                `FROM sys.indexes ind ` +
                `INNER JOIN ${dbName}.sys.index_columns ic ON ind.object_id = ic.object_id AND ind.index_id = ic.index_id ` +
                `INNER JOIN ${dbName}.sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id ` +
                `INNER JOIN ${dbName}.sys.tables t ON ind.object_id = t.object_id ` +
                `WHERE ind.is_primary_key = 0 AND ind.is_unique_constraint = 0 AND t.is_ms_shipped = 0`;
        }).join(" UNION ALL ");
        const [
            dbTables,
            dbColumns,
            dbConstraints,
            dbForeignKeys,
            dbIdentityColumns,
            dbIndices
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(foreignKeysSql),
            this.query(identityColumnsSql),
            this.query(indicesSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return await Promise.all(dbTables.map(async dbTable => {
            const table = new Table();

            // We do not need to join schema and database names, when db or schema is by default.
            // In this case we need local variable `tableFullName` for below comparision.
            const db = dbTable["TABLE_CATALOG"] === currentDatabase ? undefined : dbTable["TABLE_CATALOG"];
            const schema = dbTable["TABLE_SCHEMA"] === currentSchema ? undefined : dbTable["TABLE_SCHEMA"];
            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], schema, db);
            const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["TABLE_SCHEMA"], dbTable["TABLE_CATALOG"]);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => this.driver.buildTableName(dbColumn["TABLE_NAME"], dbColumn["TABLE_SCHEMA"], dbColumn["TABLE_CATALOG"]) === tableFullName)
                .map(dbColumn => {
                    const columnConstraints = dbConstraints.filter(dbConstraint => {
                        return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                            && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });

                    const isPrimary = !!columnConstraints.find(constraint =>  constraint["CONSTRAINT_TYPE"] === "PRIMARY KEY");
                    const isUnique = !!columnConstraints.find(constraint => constraint["CONSTRAINT_TYPE"] === "UNIQUE");
                    const isGenerated = !!dbIdentityColumns.find(column => {
                        return this.driver.buildTableName(column["TABLE_NAME"], column["TABLE_SCHEMA"], column["TABLE_CATALOG"]) === tableFullName
                            && column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();

                    tableColumn.length = dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString() : "";
                    if (tableColumn.length === "-1")
                        tableColumn.length = "MAX";

                    if (tableColumn.type !== "int") {
                        tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                        tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                    }
                    tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = isGenerated;
                    if (isGenerated)
                        tableColumn.generationStrategy = "increment";
                    if (tableColumn.default === "(newsequentialid())") {
                        tableColumn.isGenerated = true;
                        tableColumn.generationStrategy = "uuid";
                        tableColumn.default = undefined;
                    }
                    tableColumn.isUnique = isUnique;
                    tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                    tableColumn.collation = dbColumn["COLLATION_NAME"];

                    if (tableColumn.type === "datetime2" || tableColumn.type === "time" || tableColumn.type === "datetimeoffset") {
                        tableColumn.precision = dbColumn["DATETIME_PRECISION"];
                    }

                    return tableColumn;
                });

            // create table primary key
            const primaryKeys = dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                    && dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
            });
            if (primaryKeys.length > 0) {
                table.primaryKey = new TablePrimaryKey(<TablePrimaryKeyOptions>{
                    table: table,
                    name: primaryKeys[0]["CONSTRAINT_NAME"],
                    columnNames: primaryKeys.map(primaryKey => primaryKey["COLUMN_NAME"])
                });
            }

            // find unique constraints of table, group them by constraint name and return new TableUnique.
            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                    && dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                return new TableUnique({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: uniques.map(u => u["COLUMN_NAME"])
                });
            });

            table.checks = dbConstraints
                .filter(dbConstraint => {
                    const isCheckExist = !!table.checks.find(c => c.name === dbConstraint["CONSTRAINT_NAME"]);
                    return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                        && dbConstraint["CONSTRAINT_TYPE"] === "CHECK" && !isCheckExist;
                })
                .map(dbConstraint => {
                    const checks = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === dbConstraint["CONSTRAINT_NAME"]);
                    return new TableCheck({
                        name: dbConstraint["CONSTRAINT_NAME"],
                        columnNames: checks.map(c => c["COLUMN_NAME"])
                    });
                });

            // create table foreign keys from the loaded foreign keys
            table.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => {
                    const isForeignKeyExist = !!table.foreignKeys.find(fk => fk.name === dbForeignKey["FK_NAME"]);
                    return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], dbForeignKey["TABLE_SCHEMA"], dbForeignKey["TABLE_CATALOG"]) === tableFullName && !isForeignKeyExist;
                })
                .map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["FK_NAME"] === dbForeignKey["FK_NAME"]);
                    return new TableForeignKey({
                        name: dbForeignKey["FK_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: this.driver.buildTableName(dbForeignKey["REF_TABLE"], dbForeignKey["REF_SCHEMA"], dbForeignKey["TABLE_CATALOG"]),
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REF_COLUMN"]),
                        onDelete: dbForeignKey["ON_DELETE"],
                        onUpdate: dbForeignKey["ON_UPDATE"]
                    });
                });

            // find index constraints of table, group them by constraint name and build TableIndex.
            const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
                return this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["TABLE_SCHEMA"], dbIndex["TABLE_CATALOG"]) === tableFullName;
            }), dbIndex => dbIndex["INDEX_NAME"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbIndices.filter(index => index["INDEX_NAME"] === constraint["INDEX_NAME"]);
                return new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["INDEX_NAME"],
                    columnNames: indices.map(i => i["COLUMN_NAME"]),
                    isUnique: constraint["IS_UNIQUE"]
                });
            });

            return table;
        }));
    }

    /**
     * Builds and returns SQL for create table.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

        const uniqueColumns = table.columns
            .filter(column => column.isUnique)
            .map(column => {
                return new TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                });
            });
        table.uniques.push(...uniqueColumns);

        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques.map(unique => {
                const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
                return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`;
            }).join(", ");

            sql += `, ${uniquesSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");

                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        const primaryColumns = table.columns.filter(column => column.isPrimary);
        if (primaryColumns.length > 0) {
            const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`;
        }

        sql += `)`;

        return sql;
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(tableOrName: Table|string, ifExist?: boolean): string {
        return ifExist ? `DROP TABLE IF EXISTS ${this.escapeTableName(tableOrName)}` : `DROP TABLE ${this.escapeTableName(tableOrName)}`;
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(index.name, table.name, index.columnNames);
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapeTableName(table)}(${columns})`;
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(table: Table, indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return `DROP INDEX "${indexName}" ON ${this.escapeTableName(table)}`;
    }

    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const fkName = foreignKey.name
            ? foreignKey.name
            : this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${fkName}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return sql;
    }

    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): string {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${foreignKeyName}"`;
    }

    /**
     * Escapes given table path.
     */
    protected escapeTableName(tableOrName: Table|string, disableEscape?: boolean): string {
        let name = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        if (this.driver.options.schema) {
            if (name.indexOf(".") === -1) {
                name = `${this.driver.options.schema}.${name}`;
            } else if (name.split(".").length === 3) {
                const splittedName = name.split(".");
                const dbName = splittedName[0];
                const tableName = splittedName[2];
                name = `${dbName}.${this.driver.options.schema}.${tableName}`;
            }
        }

        return name.split(".").map(i => {
            // this condition need because when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    protected parseTableName(target: Table|string): any {
        const tableName = target instanceof Table ? target.name : target;
        if (tableName.split(".").length === 3) {
            return {
                database:  "'" + tableName.split(".")[0] + "'",
                schema:  tableName.split(".")[1] === "" ? "SCHEMA_NAME()" : "'" + tableName.split(".")[1] + "'",
                tableName: "'" + tableName.split(".")[2] + "'"
            };
        } else if (tableName.split(".").length === 2) {
            return {
                database:  this.driver.options.database,
                schema: "'" + tableName.split(".")[1] + "'",
                tableName: "'" + tableName.split(".")[2] + "'"
            };
        } else {
            return {
                database:  this.driver.options.database,
                schema: this.driver.options.schema ? "'" + this.driver.options.schema + "'" : "SCHEMA_NAME()",
                tableName: tableName
            };
        }
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startFrom: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => {
            return `"${key}"` + "=@" + (startFrom + index);
        });
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: TableColumn, skipIdentity: boolean, createDefault: boolean) {
        let c = `"${column.name}" ${this.connection.driver.createFullType(column)}`;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment" && !skipIdentity) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " IDENTITY(1,1)";
        if (column.default !== undefined && column.default !== null && createDefault)
            c += " DEFAULT " + column.default;
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default)
            c += " DEFAULT NEWSEQUENTIALID()";
        return c;
    }

    /**
     * Converts MssqlParameter into real mssql parameter type.
     */
    protected mssqlParameterToNativeParameter(parameter: MssqlParameter): any {
        switch (this.driver.normalizeType({ type: parameter.type as any })) {
            case "bit":
                return this.driver.mssql.Bit;
            case "bigint":
                return this.driver.mssql.BigInt;
            case "decimal":
                return this.driver.mssql.Decimal(...parameter.params);
            case "float":
                return this.driver.mssql.Float;
            case "int":
                return this.driver.mssql.Int;
            case "money":
                return this.driver.mssql.Money;
            case "numeric":
                return this.driver.mssql.Numeric(...parameter.params);
            case "smallint":
                return this.driver.mssql.SmallInt;
            case "smallmoney":
                return this.driver.mssql.SmallMoney;
            case "real":
                return this.driver.mssql.Real;
            case "tinyint":
                return this.driver.mssql.TinyInt;
            case "char":
                return this.driver.mssql.Char(...parameter.params);
            case "nchar":
                return this.driver.mssql.NChar(...parameter.params);
            case "text":
                return this.driver.mssql.Text;
            case "ntext":
                return this.driver.mssql.Ntext;
            case "varchar":
                return this.driver.mssql.VarChar(...parameter.params);
            case "nvarchar":
                return this.driver.mssql.NVarChar(...parameter.params);
            case "xml":
                return this.driver.mssql.Xml;
            case "time":
                return this.driver.mssql.Time(...parameter.params);
            case "date":
                return this.driver.mssql.Date;
            case "datetime":
                return this.driver.mssql.DateTime;
            case "datetime2":
                return this.driver.mssql.DateTime2(...parameter.params);
            case "datetimeoffset":
                return this.driver.mssql.DateTimeOffset(...parameter.params);
            case "smalldatetime":
                return this.driver.mssql.SmallDateTime;
            case "uniqueidentifier":
                return this.driver.mssql.UniqueIdentifier;
            case "variant":
                return this.driver.mssql.Variant;
            case "binary":
                return this.driver.mssql.Binary;
            case "varbinary":
                return this.driver.mssql.VarBinary(...parameter.params);
            case "image":
                return this.driver.mssql.Image;
            case "udt":
                return this.driver.mssql.UDT;
            case "geography":
                return this.driver.mssql.Geography;
            case "geometry":
                return this.driver.mssql.Geometry;
        }
    }

}