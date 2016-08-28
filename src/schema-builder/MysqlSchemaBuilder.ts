import {SchemaBuilder, DatabaseColumnProperties} from "./SchemaBuilder";
import {MysqlDriver} from "../driver/MysqlDriver";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {DatabaseConnection} from "../driver/DatabaseConnection";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {DataTypeNotSupportedByDriverError} from "./error/DataTypeNotSupportedByDriverError";
import {TableSchema} from "../schema-creator/TableSchema";
import {ColumnSchema} from "../schema-creator/ColumnSchema";
import {PrimaryKeySchema} from "../schema-creator/PrimaryKeySchema";
import {ForeignKeySchema} from "../schema-creator/ForeignKeySchema";
import {IndexSchema} from "../schema-creator/IndexSchema";
import {UniqueKeySchema} from "../schema-creator/UniqueKeySchema";

/**
 * @internal
 */
export class MysqlSchemaBuilder extends SchemaBuilder {
    
    constructor(private driver: MysqlDriver,
                private dbConnection: DatabaseConnection) {
        super();
    }

    async loadSchemaTables(tableNames: string[]): Promise<TableSchema[]> {

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
            const primaryKey = primaryKeys.find(primaryKey => primaryKey["TABLE_NAME"] === tableSchema.name);
            if (primaryKey)
                tableSchema.primaryKey = new PrimaryKeySchema(primaryKey["CONSTRAINT_NAME"]);

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["TABLE_NAME"] === tableSchema.name)
                .map(dbForeignKey => new ForeignKeySchema(dbForeignKey["CONSTRAINT_NAME"]));

            // create unique key schemas from the loaded indices
            tableSchema.uniqueKeys = dbUniqueKeys
                .filter(dbUniqueKey => dbUniqueKey["TABLE_NAME"] === tableSchema.name)
                .map(dbUniqueKey => new UniqueKeySchema(dbUniqueKey["CONSTRAINT_NAME"]));

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    const condition = dbIndex["TABLE_NAME"] === tableSchema.name && !tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"]);
                    if (condition)
                        console.log(dbIndex["INDEX_NAME"], "::", tableSchema.foreignKeys);
                    return condition;
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName)
                        .map(dbIndex => dbIndex["COLUMN_NAME"]);

                    return new IndexSchema(dbIndexName, columnNames);
                });

            return tableSchema;
        });
    }

    async createTable(table: TableMetadata, columns: ColumnMetadata[]): Promise<void> {
        const columnDefinitions = columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        const sql = `CREATE TABLE \`${table.name}\` (${columnDefinitions}) ENGINE=InnoDB;`;
        await this.query(sql);
    }

    async createColumn(tableName: string, column: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` ADD ${this.buildCreateColumnSql(column, false)}`;
        await this.query(sql);
    }

    async changeColumn(tableName: string, oldColumn: ColumnSchema, newColumn: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, oldColumn.isPrimary)}`; // todo: CHANGE OR MODIFY COLUMN ????
        await this.query(sql);
    }

    async dropColumn(tableName: string, columnName: string): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` DROP \`${columnName}\``;
        await this.query(sql);
    }

    async createForeignKey(foreignKey: ForeignKeyMetadata): Promise<void> {
        const columnNames = foreignKey.columnNames.map(column => "`" + column + "`").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "`" + column + "`").join(",");
        let sql = `ALTER TABLE ${foreignKey.tableName} ADD CONSTRAINT \`${foreignKey.name}\` ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES \`${foreignKey.referencedTable.name}\`(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        await this.query(sql);
    }

    async dropForeignKey(tableName: string, foreignKeyName: string): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${foreignKeyName}\``;
        await this.query(sql);
    }

    async dropIndex(tableName: string, indexName: string): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``;
        await this.query(sql);
    }

    async createIndex(tableName: string, index: IndexMetadata): Promise<void> {
        const columns = index.columns.map(column => "`" + column + "`").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX \`${index.name}\` ON \`${tableName}\`(${columns})`;
        await this.query(sql);
    }

    async createUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${keyName}\` UNIQUE (\`${columnName}\`)`;
        await this.query(sql);
    }

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
    // Private Methods
    // -------------------------------------------------------------------------
    
    private query(sql: string) {
        return this.driver.query(this.dbConnection, sql);
    }

    private get dbName(): string {
        return this.driver.options.database as string;
    }

    private buildCreateColumnSql(column: ColumnMetadata, skipPrimary: boolean) {
        let c = "`" + column.name + "` " + this.normalizeType(column);
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isPrimary === true && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        if (column.columnDefinition)
            c += " " + column.columnDefinition;
        return c;
    }

    // -------------------------------------------------------------------------
    // Deprecated Methods
    // -------------------------------------------------------------------------

    async renameColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` CHANGE \`${oldColumn.name}\` \`${newColumn.name}\` ${oldColumn.type}`;
        await this.query(sql);
    }

    getTableForeignQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = "${this.dbName}" `
            + `AND TABLE_NAME = "${tableName}" AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        return this.query(sql).then((results: any[]) => results.map(result => result.CONSTRAINT_NAME));
    }


    /**
     * todo: reuse getColumns
     */
    getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<DatabaseColumnProperties[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.dbName}'` +
            ` AND TABLE_NAME = '${tableName}'`;
        return this.query(sql).then((results: any[]) => {

            return columns.filter(column => {
                const dbData = results.find(result => result.COLUMN_NAME === column.name);
                if (!dbData) return false;

                const newType = this.normalizeType(column);
                const isNullable = column.isNullable === true ? "YES" : "NO";
                const hasDbColumnAutoIncrement = dbData.EXTRA.indexOf("auto_increment") !== -1;
                const hasDbColumnPrimaryIndex = dbData.COLUMN_KEY.indexOf("PRI") !== -1;
                return  dbData.COLUMN_TYPE.toLowerCase() !== newType.toLowerCase() ||
                    dbData.COLUMN_COMMENT !== column.comment ||
                    dbData.IS_NULLABLE !== isNullable ||
                    hasDbColumnAutoIncrement !== column.isGenerated ||
                    hasDbColumnPrimaryIndex !== column.isPrimary;

            }).map(column => {
                const dbData = results.find(result => result.COLUMN_NAME === column.name);
                const hasDbColumnPrimaryIndex = dbData.COLUMN_KEY.indexOf("PRI") !== -1;
                return {
                    name: column.name,
                    type: dbData["COLUMN_TYPE"].toLowerCase(),
                    nullable: dbData["IS_NULLABLE"] === "YES",
                    hasPrimaryKey: hasDbColumnPrimaryIndex
                };
            });
        });
    }

    checkIfTableExist(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${this.dbName}' AND TABLE_NAME = '${tableName}'`;
        return this.query(sql).then(results => !!(results && results.length));
    }

    getTableUniqueKeysQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = "${this.dbName}" ` +
            `AND TABLE_NAME = "${tableName}" AND CONSTRAINT_TYPE = 'UNIQUE'`;
        return this.query(sql).then((results: any[]) => results.map(result => result.CONSTRAINT_NAME));
    }

    getTableIndicesQuery(tableName: string): Promise<{ key: string, sequence: number, column: string }[]> {
        const sql = `SHOW INDEX FROM ${tableName}`;
        return this.query(sql).then((results: any[]) => {
            // exclude foreign keys
            return this.getTableForeignQuery(tableName).then(foreignKeys => {

                return results
                    .filter(result => result.Key_name !== "PRIMARY" && foreignKeys.indexOf(result.Key_name) === -1)
                    .map(result => ({
                        key: result.Key_name,
                        sequence: result.Seq_in_index,
                        column: result.Column_name
                    }));
            });
        });
    }

    getPrimaryConstraintName(tableName: string): Promise<string> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = "${this.dbName}"`
            + ` AND TABLE_NAME = "${tableName}" AND CONSTRAINT_TYPE = 'PRIMARY KEY'`;
        return this.query(sql).then(results => results && results.length ? results[0].CONSTRAINT_NAME : undefined);
    }

    getTableColumns(tableName: string): Promise<DatabaseColumnProperties[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.dbName}' AND TABLE_NAME = '${tableName}'`;
        return this.query(sql).then((results: any[]) => {
            return results.map(dbColumn => {
                const hasDbColumnPrimaryIndex = dbColumn["COLUMN_KEY"].indexOf("PRI") !== -1;
                return {
                    name: dbColumn["COLUMN_NAME"],
                    type: dbColumn["COLUMN_TYPE"].toLowerCase(),
                    nullable: dbColumn["IS_NULLABLE"] === "YES",
                    hasPrimaryKey: hasDbColumnPrimaryIndex
                };
            });
        });
    }

    /**
     * @deprecated
     */
    async changeColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE \`${tableName}\` CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, oldColumn.hasPrimaryKey)}`; // todo: CHANGE OR MODIFY COLUMN ????
        await this.query(sql);
    }

}