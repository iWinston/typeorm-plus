import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {PostgresDriver} from "./PostgresDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {OrmUtils} from "../../util/OrmUtils";
import {InsertResult} from "../InsertResult";
import {QueryFailedError} from "../../error/QueryFailedError";

/**
 * Runs queries on a single postgres database connection.
 */
export class PostgresQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: PostgresDriver;

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Isolated entity manager working only with current query runner.
     */
    manager: EntityManager;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    isReleased = false;

    /**
     * Indicates if transaction is in progress.
     */
    isTransactionActive = false;

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data = {};

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Special callback provided by a driver used to release a created connection.
     */
    protected releaseCallback: Function;

    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean = false;

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlsInMemory: (string|{ up: string, down: string })[] = [];

    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: "master"|"slave";

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: PostgresDriver, mode: "master"|"slave" = "master") {
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
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(([connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(([connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }

        return this.databaseConnectionPromise;
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        if (this.releaseCallback)
            this.releaseCallback();

        const index = this.driver.connectedQueryRunners.indexOf(this);
        if (index !== -1) this.driver.connectedQueryRunners.splice(index);

        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        await this.query("START TRANSACTION");
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("ROLLBACK");
        this.isTransactionActive = false;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        return new Promise<any[]>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();

            databaseConnection.query(query, parameters, (err: any, result: any) => {

                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                if (err) {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                } else {
                    ok(result.rows);
                }
            });
        });
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        const QueryStream = this.driver.loadStreamDependency();
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const stream = databaseConnection.query(new QueryStream(query, parameters));
                if (onEnd) stream.on("end", onEnd);
                if (onError) stream.on("error", onError);
                ok(stream);

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral): Promise<InsertResult> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const generatedColumns = this.connection.hasMetadata(tableName) ? this.connection.getMetadata(tableName).generatedColumns : [];
        const generatedColumnNames = generatedColumns.map(generatedColumn => `"${generatedColumn.databaseName}"`).join(", ");
        const generatedColumnSql = generatedColumns.length > 0 ? ` RETURNING ${generatedColumnNames}` : "";

        const sql = columns.length > 0
            ? `INSERT INTO "${tableName}"(${columns}) VALUES (${values}) ${generatedColumnSql}`
            : `INSERT INTO "${tableName}" DEFAULT VALUES ${generatedColumnSql}`;

        const parameters = keys.map(key => keyValues[key]);
        const result: ObjectLiteral[] = await this.query(sql, parameters);
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
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const query = `UPDATE "${tableName}" SET ${updateValues}${conditionString ? (" WHERE " + conditionString) : ""}`;
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(query, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO "${tableName}"("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", ${newEntityId}, "level" + 1 FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO "${tableName}"("ancestor", "descendant") ` +
                `SELECT "ancestor", ${newEntityId} FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Loads given table's data from the database.
     */
    async getTable(tableName: string): Promise<TableSchema|undefined> {
        const tableSchemas = await this.getTables([tableName]);
        return tableSchemas.length > 0 ? tableSchemas[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async getTables(tableNames: string[]): Promise<TableSchema[]> {
        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql      = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name IN (${tableNamesString})`;
        const columnsSql     = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}'`;
        const indicesSql     = `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name, ix.indisunique AS is_unique, a.attnum, ix.indkey FROM pg_class t, pg_class i, pg_index ix, pg_attribute a, pg_namespace ns
WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid
AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname IN (${tableNamesString}) AND t.relnamespace = ns.OID AND ns.nspname ='${this.schemaName}' ORDER BY t.relname, i.relname`;
        const foreignKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND constraint_type = 'FOREIGN KEY'`;
        const uniqueKeysSql  = `SELECT * FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND constraint_type = 'UNIQUE'`;
        const primaryKeysSql = `SELECT c.column_name, tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
where constraint_type = 'PRIMARY KEY' AND c.table_schema = '${this.schemaName}' and tc.table_catalog = '${this.dbName}'`;
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
                    const isGenerated = dbColumn["column_default"] === `nextval('${dbColumn["table_name"]}_${dbColumn["column_name"]}_seq'::regclass)`
                        || dbColumn["column_default"] === `nextval('"${dbColumn["table_name"]}_${dbColumn["column_name"]}_seq"'::regclass)`
                        || /^uuid\_generate\_v\d\(\)/.test(dbColumn["column_default"]);

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["column_name"];
                    columnSchema.type = dbColumn["data_type"].toLowerCase();
                    columnSchema.length = dbColumn["character_maximum_length"];
                    columnSchema.precision = dbColumn["numeric_precision"];
                    columnSchema.scale = dbColumn["numeric_scale"];
                    columnSchema.default = dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined ? dbColumn["column_default"].replace(/::character varying/, "") : undefined;
                    columnSchema.isNullable = dbColumn["is_nullable"] === "YES";
                    // columnSchema.isPrimary = dbColumn["column_key"].indexOf("PRI") !== -1;
                    columnSchema.isGenerated = isGenerated;
                    columnSchema.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    columnSchema.charset = dbColumn["character_set_name"];
                    columnSchema.collation = dbColumn["collation_name"];
                    columnSchema.isUnique = !!dbUniqueKeys.find(key => key["constraint_name"] ===  `uk_${dbColumn["table_name"]}_${dbColumn["column_name"]}`);
                    if (columnSchema.type === "array") {
                        columnSchema.isArray = true;
                        const type = dbColumn["udt_name"].substring(1);
                        columnSchema.type = this.connection.driver.normalizeType({type: type});
                    }

                    if (columnSchema.type === "time without time zone"
                        || columnSchema.type === "time with time zone"
                        || columnSchema.type === "timestamp without time zone"
                        || columnSchema.type === "timestamp with time zone") {
                        columnSchema.precision = dbColumn["datetime_precision"];
                    }
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
                    const dbIndicesInfos = dbIndices
                        .filter(dbIndex => dbIndex["table_name"] === tableSchema.name && dbIndex["index_name"] === dbIndexName);
                    const columnPositions = dbIndicesInfos[0]["indkey"].split(" ")
                        .map((x: string) => parseInt(x));
                    const columnNames = columnPositions
                        .map((pos: number) => dbIndicesInfos.find(idx => idx.attnum === pos)!["column_name"]);

                    return new IndexSchema(dbTable["table_name"], dbIndexName, columnNames, dbIndicesInfos[0]["is_unique"]);
                });

            return tableSchema;
        });
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a schema if it's not created.
     */
    createSchema(): Promise<void> {
        return this.query(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        let up = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        up += table.columns
            .filter(column => column.isUnique)
            .map(column => `, CONSTRAINT "uk_${table.name}_${column.name}" UNIQUE ("${column.name}")`)
            .join(" ");
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            up += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        up += `)`;

        const down = `DROP TABLE "${table.name}"`;
        await this.schemaQuery(up, down);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableName: string): Promise<void> {
        let sql = `DROP TABLE "${tableName}"`;
        await this.query(sql);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const sql = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name = '${tableName}' AND column_name = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const up = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column, false)}`;
        const down = `ALTER TABLE "${tableName}" DROP "${column.name}"`;

        return this.schemaQuery(up, down);
    }

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchemaOrName: TableSchema|string, columns: ColumnSchema[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableSchemaOrName as any, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumnSchemaOrName: ColumnSchema|string): Promise<void> {

        let tableSchema: TableSchema|undefined = undefined;
        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.getTable(tableSchemaOrName);
        }

        if (!tableSchema)
            throw new Error(`Table ${tableSchemaOrName} was not found.`);

        let oldColumn: ColumnSchema|undefined = undefined;
        if (oldColumnSchemaOrName instanceof ColumnSchema) {
            oldColumn = oldColumnSchemaOrName;
        } else {
            oldColumn = tableSchema.columns.find(column => column.name === oldColumnSchemaOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldColumnSchemaOrName}" was not found in the "${tableSchemaOrName}" table.`);

        let newColumn: ColumnSchema|undefined = undefined;
        if (newColumnSchemaOrName instanceof ColumnSchema) {
            newColumn = newColumnSchemaOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newColumnSchemaOrName;
        }

        return this.changeColumn(tableSchema, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumn: ColumnSchema): Promise<void> {

        let tableSchema: TableSchema|undefined = undefined;
        const sql: Array<{up: string, down: string}> = [];

        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.getTable(tableSchemaOrName);
        }

        if (!tableSchema)
            throw new Error(`Table ${tableSchemaOrName} was not found.`);

        let oldColumn: ColumnSchema|undefined = undefined;
        if (oldColumnSchemaOrName instanceof ColumnSchema) {
            oldColumn = oldColumnSchemaOrName;
        } else {
            oldColumn = tableSchema.columns.find(column => column.name === oldColumnSchemaOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldColumnSchemaOrName}" was not found in the "${tableSchemaOrName}" table.`);

        if (this.connection.driver.createFullType(oldColumn) !== this.connection.driver.createFullType(newColumn) ||
            oldColumn.name !== newColumn.name) {

            let up = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}"`;
            if (this.connection.driver.createFullType(oldColumn) !== this.connection.driver.createFullType(newColumn)) {
                up += ` TYPE ${this.connection.driver.createFullType(newColumn)}`;
            }
            if (oldColumn.name !== newColumn.name) { // todo: make rename in a separate query too
                up += ` RENAME TO ` + newColumn.name;
            }
            sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
        }

        if (oldColumn.isNullable !== newColumn.isNullable) {
            let up = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}"`;
            if (newColumn.isNullable) {
                up += ` DROP NOT NULL`;
            } else {
                up += ` SET NOT NULL`;
            }

            sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
        }

        // update sequence generation
        if (oldColumn.isGenerated !== newColumn.isGenerated) {
            if (!oldColumn.isGenerated && newColumn.type !== "uuid") {
                const up = `CREATE SEQUENCE "${tableSchema.name}_${oldColumn.name}_seq" OWNED BY "${tableSchema.name}"."${oldColumn.name}"`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic

                const up2 = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}" SET DEFAULT nextval('"${tableSchema.name}_${oldColumn.name}_seq"')`;
                sql.push({up: up2, down: `-- TODO: revert ${up2}`}); // TODO: Add revert logic
            } else {
                const up = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}" DROP DEFAULT`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic

                const up2 = `DROP SEQUENCE "${tableSchema.name}_${oldColumn.name}_seq"`;
                sql.push({up: up2, down: `-- TODO: revert ${up2}`}); // TODO: Add revert logic
            }
        }

        if (oldColumn.comment !== newColumn.comment) {
            const up = `COMMENT ON COLUMN "${tableSchema.name}"."${oldColumn.name}" is '${newColumn.comment}'`;
            sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
        }

        if (oldColumn.isUnique !== newColumn.isUnique) {
            if (newColumn.isUnique === true) {
                const up = `ALTER TABLE "${tableSchema.name}" ADD CONSTRAINT "uk_${tableSchema.name}_${newColumn.name}" UNIQUE ("${newColumn.name}")`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
            } else if (newColumn.isUnique === false) {
                const up = `ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "uk_${tableSchema.name}_${newColumn.name}"`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
            }

        }

        if (newColumn.default !== oldColumn.default) {
            if (newColumn.default !== null && newColumn.default !== undefined) {
                const up = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic

            } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                const up = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${newColumn.name}" DROP DEFAULT`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
            }
        }

        await Promise.all(sql.map(({up, down}) => this.schemaQuery(up, down)));
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableSchema, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: TableSchema, column: ColumnSchema): Promise<void> {
        const up = `ALTER TABLE "${table.name}" DROP "${column.name}"`;
        const down = `ALTER TABLE "${table.name}" ADD ${this.buildCreateColumnSql(column, false)}`;

        return this.schemaQuery(up, down);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(table, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => `"${primaryKey.columnName}"`);

        const up = `ALTER TABLE "${dbTable.name}" DROP CONSTRAINT IF EXISTS "${dbTable.name}_pkey"`;
        const down = `-- TODO: revert ${up}`;
        await this.schemaQuery(up, down); // TODO: Add revert logic

        const up2 = `DROP INDEX IF EXISTS "${dbTable.name}_pkey"`;
        const down2 = `-- TODO: revert ${up2}`;
        await this.schemaQuery(up2, down2); // TODO: Add revert logic

        if (primaryColumnNames.length > 0) {
            const up3 = `ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            const down3 = `ALTER TABLE "${dbTable.name}" DROP PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            await this.schemaQuery(up3, down3);
        }
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const {add: up, drop: down} = this.foreignKeySql(tableSchemaOrName, foreignKey);

        return this.schemaQuery(up, down);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const {add: down, drop: up} = this.foreignKeySql(tableSchemaOrName, foreignKey);

        return this.schemaQuery(up, down);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableName: string, index: IndexSchema): Promise<void> {
        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");

        const up = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${tableName}"(${columnNames})`;
        const down = `-- TODO: revert ${up}`;
        await this.schemaQuery(up, down); // TODO: Add revert logic
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (isGenerated) {
            const up = `ALTER SEQUENCE "${tableName}_id_seq" OWNED BY NONE`;
            const down = `-- TODO: revert ${up}`;
            await this.schemaQuery(up, down); // TODO: Add revert logic
        }

        const up = `DROP INDEX "${indexName}"`; // todo: make sure DROP INDEX should not be used here
        const down = `-- TODO: revert ${up}`;
        await this.schemaQuery(up, down); // TODO: Add revert logic
    }

    /**
     * Truncates table.
     */
    async truncate(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE "${tableName}"`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as query FROM pg_tables WHERE schemaname = '${this.schemaName}'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        this.sqlMemoryMode = true;
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        this.sqlsInMemory = [];
        this.sqlMemoryMode = false;
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): (string|{ up: string, down: string })[] {
        return this.sqlsInMemory;
    }

  /**
   * Executes sql used special for schema build.
   */
  protected async schemaQuery(upQuery: string, downQuery: string): Promise<void> {

      // if sql-in-memory mode is enabled then simply store sql in memory and return
      if (this.sqlMemoryMode === true) {
          this.sqlsInMemory.push({ up: upQuery, down: downQuery });
          return Promise.resolve() as Promise<any>;
      }

    await this.query(upQuery);
  }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Database name shortcut.
     */
    protected get dbName(): string {
        return this.driver.database!;
    }

    protected foreignKeySql(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): {add: string, drop: string} {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;

        let add = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY ("${foreignKey.columnNames.join("\", \"")}") ` +
            `REFERENCES "${foreignKey.referencedTableName}"("${foreignKey.referencedColumnNames.join("\", \"")}")`;
        if (foreignKey.onDelete) add += " ON DELETE " + foreignKey.onDelete;

        const drop = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKey.name}"`;

        return {add, drop};
    }

    /**
     * Schema name shortcut.
     */
    protected get schemaName() {
        return this.driver.options.schema || this.driver.options.schemaName || "public";
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => "\"" + key + "\"=$" + (startIndex + index + 1));
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema, skipPrimary: boolean) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " SERIAL";
        if (!column.isGenerated || column.type === "uuid")
            c += " " + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET \"" + column.charset + "\"";
        if (column.collation)
            c += " COLLATE \"" + column.collation + "\"";
        if (column.isNullable !== true)
            c += " NOT NULL";
        // if (column.isPrimary)
        //     c += " PRIMARY KEY";
        if (column.default !== undefined && column.default !== null) { // todo: same code in all drivers. make it DRY
            c += " DEFAULT " + column.default;
        }
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default)
            c += " DEFAULT uuid_generate_v4()";
        return c;
    }

}
