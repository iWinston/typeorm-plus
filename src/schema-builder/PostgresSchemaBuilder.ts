import {SchemaBuilder, DatabaseColumnProperties} from "./SchemaBuilder";
import {PostgresDriver} from "../driver/PostgresDriver";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {DatabaseConnection} from "../driver/DatabaseConnection";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {DataTypeNotSupportedByDriverError} from "./error/DataTypeNotSupportedByDriverError";

/**
 * @internal
 */
export class PostgresSchemaBuilder extends SchemaBuilder {
    
    constructor(private driver: PostgresDriver,
                private dbConnection: DatabaseConnection) {
        super();
    }
    
    async getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<DatabaseColumnProperties[]> {
        const dbColumns = await this.getTableColumns(tableName);
        return dbColumns.filter(dbColumn => {
            const column = columns.find(column => column.name === dbColumn.name);
            if (!column)
                return false;

            return  dbColumn.nullable !== column.isNullable ||
                    dbColumn.type !== this.normalizeType(column) ||
                    dbColumn.generated !== column.isGenerated;
        });
    }

    checkIfTableExist(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = '${this.dbName}' AND TABLE_NAME = '${tableName}'`;
        return this.query(sql).then(results => !!(results && results.length));
    }

    addColumnQuery(tableName: string, column: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column, false)}`;
        return this.query(sql).then(() => {});
    }

    dropColumnQuery(tableName: string, columnName: string): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" DROP "${columnName}"`;
        return this.query(sql).then(() => {});
    }

    addForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void> {
        let sql = `ALTER TABLE "${foreignKey.tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY ("${foreignKey.columnNames.join("\", \"")}") ` +
            `REFERENCES "${foreignKey.referencedTable.name}"("${foreignKey.referencedColumnNames.join("\", \"")}")`;
        if (foreignKey.onDelete)
            sql += " ON DELETE " + foreignKey.onDelete;
        return this.query(sql).then(() => {});
    }

    dropForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void>;
    dropForeignKeyQuery(tableName: string, foreignKeyName: string): Promise<void>;
    dropForeignKeyQuery(tableNameOrForeignKey: string|ForeignKeyMetadata, foreignKeyName?: string): Promise<void> {
        let tableName = <string> tableNameOrForeignKey;
        if (tableNameOrForeignKey instanceof ForeignKeyMetadata) {
            tableName = tableNameOrForeignKey.tableName;
            foreignKeyName = tableNameOrForeignKey.name;
        }

        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKeyName}"`;
        return this.query(sql).then(() => {});
    }

    getTableForeignQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT tc.constraint_name FROM information_schema.table_constraints AS tc ` +
        `WHERE constraint_type = 'FOREIGN KEY' AND tc.table_catalog='${this.dbName}' AND tc.table_name='${tableName}'`;
        // const sql = `SELECT * FROM INFORMATION_SCHEMA.table_constraints WHERE TABLE_CATALOG = '${this.dbName}' `
        //     + `AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE='FOREIGN KEY'`;
        return this.query(sql).then((results: any[]) => results.map(result => result.constraint_name));
    }

    getTableUniqueKeysQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_CATALOG='${this.dbName}' ` +
            `AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE = 'UNIQUE'`;
        return this.query(sql).then((results: any[]) => results.map(result => result.CONSTRAINT_NAME));
    }

    getTableIndicesQuery(tableName: string): Promise<{ key: string, sequence: number, column: string }[]> {
        const sql = `select t.relname as table_name, i.relname as index_name, a.attname as column_name, ix.indisprimary as is_primary from pg_class t, pg_class i, pg_index ix, pg_attribute a 
where t.oid = ix.indrelid and i.oid = ix.indexrelid and a.attrelid = t.oid and a.attnum = ANY(ix.indkey) and t.relkind = 'r' and t.relname = '${tableName}'
order by t.relname, i.relname`;
        return this.query(sql).then((results: any[]) => {
            // exclude foreign keys
            return this.getTableForeignQuery(tableName).then(foreignKeys => {

                return results
                    .filter(result => result.is_primary !== true && foreignKeys.indexOf(result.index_name) === -1)
                    .map(result => ({
                        key: result.index_name,
                        sequence: result.Seq_in_index,
                        column: result.column_name
                    }));
            });
        });
    }

    getPrimaryConstraintName(tableName: string): Promise<string> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_CATALOG = '${this.dbName}'`
            + ` AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE = 'PRIMARY KEY'`;
        return this.query(sql).then(results => results && results.length ? results[0].CONSTRAINT_NAME : undefined);
    }

    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (isGenerated) {
            await this.query(`ALTER SEQUENCE "${tableName}_id_seq" OWNED BY NONE`); // todo: what is it?
        }

        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${indexName}"`;
        await this.query(sql);
    }

    createIndex(tableName: string, index: IndexMetadata): Promise<void> {
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX "${index.name}" ON "${tableName}"("${index.columns.join("\", \"")}")`;
        return this.query(sql).then(() => {});
    }

    addUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void> {
        const sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${keyName}" UNIQUE ("${columnName}")`;
        return this.query(sql).then(() => {});
    }

    async getTableColumns(tableName: string): Promise<DatabaseColumnProperties[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.dbName}' AND TABLE_NAME = '${tableName}'`;
        const results: any[] = await this.query(sql);
        const promises = results.map(async dbColumn => {
            const columnType = dbColumn.data_type.toLowerCase() + (dbColumn["character_maximum_length"] !== undefined && dbColumn["character_maximum_length"] !== null ? ("(" + dbColumn["character_maximum_length"] + ")") : "");
            const checkPrimaryResults = await this.query(`select t.relname as table_name, i.relname as index_name, a.attname 
from pg_class t, pg_class i, pg_index ix, pg_attribute a 
where t.oid = ix.indrelid and i.oid = ix.indexrelid and a.attrelid = t.oid and a.attnum = ANY(ix.indkey) and t.relkind = 'r' and t.relname = '${tableName}' and a.attname = '${dbColumn["column_name"]}'
group by t.relname, i.relname, a.attname
order by t.relname, i.relname`);
            const isGenerated = dbColumn["column_default"] === `nextval('${tableName}_id_seq'::regclass)` || dbColumn["column_default"] === `nextval('"${tableName}_id_seq"'::regclass)`;
            // const commentResults = await this.query(`SELECT cols.column_name, (SELECT pg_catalog.col_description(c.oid, cols.ordinal_position::int) FROM pg_catalog.pg_class c WHERE c.oid = (SELECT cols.table_name::regclass::oid) AND c.relname = cols.table_name) as column_comment
// FROM information_schema.columns cols WHERE cols.table_catalog = '${this.dbName}' AND cols.table_name = '${tableName}' and cols.column_name = '${dbColumn["column_name"]}'`);
            // todo: comments has issues with case sensitive, need to find solution

            return {
                name: dbColumn["column_name"],
                type: columnType,
                nullable: dbColumn["is_nullable"] === "YES",
                generated: isGenerated,
                comment: undefined, // commentResults.length ? commentResults[0]["column_comment"] : undefined,
                hasPrimaryKey: checkPrimaryResults.length > 0
            };
        });

        return Promise.all(promises);
    }

    renameColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE ${tableName} RENAME ${oldColumn.name} TO ${newColumn.name}`;
        return this.query(sql).then(() => {});
    }

    async changeColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void> {

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

        if (oldColumn.nullable !== newColumn.isNullable) {
            let sql = `ALTER TABLE "${tableName}" ALTER COLUMN "${oldColumn.name}"`;
            if (newColumn.isNullable) {
                sql += ` DROP NOT NULL`;
            } else {
                sql += ` SET NOT NULL`;
            }
            await this.query(sql);
        }

        // update sequence generation
        if (oldColumn.generated !== newColumn.isGenerated) {
            if (!oldColumn.generated) {
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

    createTableQuery(table: TableMetadata, columns: ColumnMetadata[]): Promise<void> {
        const columnDefinitions = columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        const sql = `CREATE TABLE "${table.name}" (${columnDefinitions})`;
        return this.query(sql).then(() => {});
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

    private normalizeType(column: ColumnMetadata) {
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
    
}