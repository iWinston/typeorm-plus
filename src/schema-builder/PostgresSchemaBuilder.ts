import {SchemaBuilder} from "./SchemaBuilder";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
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
import {UniqueKeySchema} from "../schema-creator/UniqueKeySchema";
import {IndexSchema} from "../schema-creator/IndexSchema";

/**
 * @internal
 */
export class PostgresSchemaBuilder extends SchemaBuilder {
    
    constructor(private driver: PostgresDriver,
                private dbConnection: DatabaseConnection) {
        super();
    }

    async loadSchemaTables(tableNames: string[]): Promise<TableSchema[]> {

        // if no tables given then no need to proceed
        if (!tableNames)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql      = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = 'public'`;
        const columnsSql     = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = 'public'`;
        const indicesSql     = `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name 
                                FROM pg_class t, pg_class i, pg_index ix, pg_attribute a
                                WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid
                                AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname IN (${tableNamesString})
                                ORDER BY t.relname, i.relname`;
        const foreignKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'FOREIGN KEY'`;
        const uniqueKeysSql  = `SELECT * FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'UNIQUE'`;
        const primaryKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'PRIMARY KEY'`;
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
                    return columnSchema;
                });

            // create primary key schema
            const primaryKey = primaryKeys.find(primaryKey => primaryKey["table_name"] === tableSchema.name);
            if (primaryKey)
                tableSchema.primaryKey = new PrimaryKeySchema(primaryKey["constraint_name"]);

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["table_name"] === tableSchema.name)
                .map(dbForeignKey => new ForeignKeySchema(dbForeignKey["constraint_name"]));

            // create unique key schemas from the loaded indices
            tableSchema.uniqueKeys = dbUniqueKeys
                .filter(dbUniqueKey => dbUniqueKey["table_name"] === tableSchema.name)
                .map(dbUniqueKey => new UniqueKeySchema(dbUniqueKey["constraint_name"]));

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["table_name"] === tableSchema.name &&
                            (!tableSchema.foreignKeys || !tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["index_name"])) &&
                            (!tableSchema.primaryKey || tableSchema.primaryKey.name !== dbIndex["index_name"]);
                })
                .map(dbIndex => dbIndex["index_name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["table_name"] === tableSchema.name && dbIndex["index_name"] === dbIndexName)
                        .map(dbIndex => dbIndex["column_name"]);

                    return new IndexSchema(dbIndexName, columnNames);
                });

            return tableSchema;
        });
    }

    async createTable(table: TableMetadata, columns: ColumnMetadata[]): Promise<void> {
        const columnDefinitions = columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        const sql = `CREATE TABLE "${table.name}" (${columnDefinitions})`;
        await this.query(sql);
    }

    async createColumn(tableName: string, column: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column, false)}`;
        await this.query(sql);
    }

    async changeColumn(tableName: string, oldColumn: ColumnSchema, newColumn: ColumnMetadata): Promise<void> {
        // update name, type, nullable
        const newType = this.normalizeType(newColumn);
        if (oldColumn.type !== newType ||
            oldColumn.name !== newColumn.name) {

            let sql = `ALTER TABLE "${tableName}" ALTER COLUMN "${oldColumn.name}"`;
            if (oldColumn.type !== newType) {
                sql += ` TYPE ${newType}`;
            }
            /*if (oldColumn.nullable !== newColumn.isNullable) {
             if (newColumn.isNullable) {
             sql += ` DROP NOT NULL`;
             } else {
             sql += ` SET NOT NULL`;
             }
             }*/
            if (oldColumn.name !== newColumn.name) { // todo: make rename in a separate query too
                sql += ` RENAME TO ` + newColumn.name;
            }
            await this.query(sql);
        }

        if (oldColumn.isNullable !== newColumn.isNullable) {
            let sql = `ALTER TABLE "${tableName}" ALTER COLUMN "${oldColumn.name}"`;
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
                await this.query(`CREATE SEQUENCE "${tableName}_id_seq" OWNED BY ${tableName}.${oldColumn.name}`);
                await this.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${oldColumn.name}" SET DEFAULT nextval('"${tableName}_id_seq"')`);
            } else {
                await this.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${oldColumn.name}" DROP DEFAULT`);
                await this.query(`DROP SEQUENCE "${tableName}_id_seq"`);
            }
        }

        if (oldColumn.comment !== newColumn.comment) {
            await this.query(`COMMENT ON COLUMN "${tableName}"."${oldColumn.name}" is '${newColumn.comment}'`);
        }
    }

    async dropColumn(tableName: string, columnName: string): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" DROP "${columnName}"`;
        await this.query(sql);
    }

    async createForeignKey(foreignKey: ForeignKeyMetadata): Promise<void> {
        let sql = `ALTER TABLE "${foreignKey.tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY ("${foreignKey.columnNames.join("\", \"")}") ` +
            `REFERENCES "${foreignKey.referencedTable.name}"("${foreignKey.referencedColumnNames.join("\", \"")}")`;
        if (foreignKey.onDelete)
            sql += " ON DELETE " + foreignKey.onDelete;
        await this.query(sql);
    }

    async dropForeignKey(tableName: string, foreignKeyName: string): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKeyName}"`;
        await this.query(sql);
    }

    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (isGenerated) {
            await this.query(`ALTER SEQUENCE "${tableName}_id_seq" OWNED BY NONE`); // todo: what is it?
        }

        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${indexName}"`;
        await this.query(sql);
    }

    async createIndex(tableName: string, index: IndexMetadata): Promise<void> {
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX "${index.name}" ON "${tableName}"("${index.columns.join("\", \"")}")`;
        await this.query(sql);
    }

    async createUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${keyName}" UNIQUE ("${columnName}")`;
        await this.query(sql);
    }

    normalizeType(column: ColumnMetadata) {
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
    // Private Methods
    // -------------------------------------------------------------------------
    
    private query(sql: string) {
        return this.driver.query(this.dbConnection, sql);
    }
    
    private get dbName(): string {
        return this.driver.options.database as string;
    }

    private buildCreateColumnSql(column: ColumnMetadata, skipPrimary: boolean) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " SERIAL";
        if (!column.isGenerated)
            c += " " + this.normalizeType(column);
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isPrimary === true && !skipPrimary)
            c += " PRIMARY KEY";
        // TODO: implement auto increment
        if (column.columnDefinition)
            c += " " + column.columnDefinition;
        return c;
    }

}