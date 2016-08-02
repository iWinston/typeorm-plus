import {SchemaBuilder} from "./SchemaBuilder";
import {PostgresDriver} from "../driver/PostgresDriver";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";

/**
 * @internal
 */
export class PostgresSchemaBuilder extends SchemaBuilder {
    
    constructor(private driver: PostgresDriver) {
        super();
    }
    
    getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<{columnName: string, hasPrimaryKey: boolean}[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.driver.db}'` +
            ` AND TABLE_NAME = '${tableName}'`;
        return this.query<any[]>(sql).then(results => {
            // console.log("changed columns: ", results);

            return columns.filter(column => {
                const dbData = results.find(result => result.column_name === column.name);
                if (!dbData) return false;

                const newType = this.normalizeType(column);
                const isNullable = column.isNullable === true ? "YES" : "NO";

                let columnType = dbData.data_type.toLowerCase();
                if (dbData.character_maximum_length) {
                    columnType += "(" + dbData.character_maximum_length + ")";
                }

                // const hasDbColumnAutoIncrement = dbData.EXTRA.indexOf("auto_increment") !== -1;
                // const hasDbColumnPrimaryIndex = dbData.column_key.indexOf("PRI") !== -1;
                return  columnType !== newType ||
                    // dbData.COLUMN_COMMENT !== column.comment ||
                    dbData.is_nullable !== isNullable; // ||
                    // hasDbColumnAutoIncrement !== column.isGenerated ||
                    // hasDbColumnPrimaryIndex !== column.isPrimary;
                
            }).map(column => {
                // const dbData = results.find(result => result.column_name === column.name);
                // const hasDbColumnPrimaryIndex = dbData.column_key.indexOf("PRI") !== -1;
                return { columnName: column.name/*, hasPrimaryKey: hasDbColumnPrimaryIndex*/ };
            });
        });
    }

    checkIfTableExist(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = '${this.driver.db}' AND TABLE_NAME = '${tableName}'`;
        return this.query<any[]>(sql).then(results => !!(results && results.length));
    }

    addColumnQuery(tableName: string, column: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE ${tableName} ADD ${this.buildCreateColumnSql(column, false)}`;
        return this.query(sql).then(() => {});
    }

    dropColumnQuery(tableName: string, columnName: string): Promise<void> {
        const sql = `ALTER TABLE ${tableName} DROP ${columnName}`;
        return this.query(sql).then(() => {});
    }

    addForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void> {
        let sql = `ALTER TABLE ${foreignKey.tableName} ADD CONSTRAINT ${foreignKey.name} ` +
            `FOREIGN KEY (${foreignKey.columnNames.join(", ")}) ` +
            `REFERENCES ${foreignKey.referencedTable.name}(${foreignKey.referencedColumnNames.join(",")})`;
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

        const sql = `ALTER TABLE ${tableName} DROP FOREIGN KEY \`${foreignKeyName}\``;
        return this.query(sql).then(() => {});
    }

    getTableForeignQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT tc.constraint_name FROM information_schema.table_constraints AS tc ` +
        `WHERE constraint_type = 'FOREIGN KEY' AND tc.table_catalog='${this.driver.db}' AND tc.table_name='${tableName}';`;
        // const sql = `SELECT * FROM INFORMATION_SCHEMA.table_constraints WHERE TABLE_CATALOG = '${this.driver.db}' `
        //     + `AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE='FOREIGN KEY'`;
        return this.query<any[]>(sql).then(results => results.map(result => result.constraint_name));
    }

    getTableUniqueKeysQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_CATALOG = '${this.driver.db}' ` +
            `AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE = 'UNIQUE'`;
        return this.query<any[]>(sql).then(results => results.map(result => result.CONSTRAINT_NAME));
    }

    getTableIndicesQuery(tableName: string): Promise<{ key: string, sequence: number, column: string }[]> {
        const sql = `select
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name,
    ix.indisprimary as is_primary
from
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
where
    t.oid = ix.indrelid
    and i.oid = ix.indexrelid
    and a.attrelid = t.oid
    and a.attnum = ANY(ix.indkey)
    and t.relkind = 'r'
    and t.relname = '${tableName}'
order by
    t.relname,
    i.relname;
`;
        return this.query<any[]>(sql).then(results => {
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
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_CATALOG = '${this.driver.db}'`
            + ` AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE = 'PRIMARY KEY'`;
        return this.query<any[]>(sql).then(results => results && results.length ? results[0].CONSTRAINT_NAME : undefined);
    }

    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (isGenerated) {
            await this.query(`ALTER SEQUENCE foo_id_seq OWNED BY NONE`);
        }

        const sql = `ALTER TABLE ${tableName} DROP CONSTRAINT ${indexName}`;
        await this.query(sql);
    }

    createIndex(tableName: string, index: IndexMetadata): Promise<void> {
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX \`${index.name}\` ON ${tableName}(${index.columns.join(", ")})`;
        return this.query(sql).then(() => {});
    }

    addUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void> {
        const sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${keyName} UNIQUE (${columnName})`;
        return this.query(sql).then(() => {});
    }

    getTableColumns(tableName: string): Promise<string[]> {
        const sql = `SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.driver.db}'` +
            ` AND TABLE_NAME = '${tableName}'`;
        return this.query<any[]>(sql).then(results => results.map(result => result.column_name));
    }

    changeColumnQuery(tableName: string, columnName: string, newColumn: ColumnMetadata, skipPrimary: boolean = false): Promise<void> {
        const sql = `ALTER TABLE ${tableName} CHANGE ${columnName} ${this.buildCreateColumnSql(newColumn, skipPrimary)}`;
        return this.query(sql).then(() => {});
    }

    createTableQuery(table: TableMetadata, columns: ColumnMetadata[]): Promise<void> {
        const columnDefinitions = columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        const sql = `CREATE TABLE "${table.name}" (${columnDefinitions})`;
        return this.query(sql).then(() => {});
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    
    private query<T>(sql: string) {
        return this.driver.query<T>(sql);
    }

    private buildCreateColumnSql(column: ColumnMetadata, skipPrimary: boolean) {
        let c = column.name;
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " SERIAL";
        if (!column.isGenerated)
            c += " " + this.normalizeType(column);
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isPrimary === true && !skipPrimary)
            c += " PRIMARY KEY";
        // TODO: implement auto increment
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        if (column.columnDefinition)
            c += " " + column.columnDefinition;
        return c;
    }

    private normalizeType(column: ColumnMetadata) {

        let realType: string = "";
        if (typeof column.type === "string") {
            realType = column.type.toLowerCase();

            // todo: remove casting to any after upgrade to typescript 2
        } else if (typeof column.type === "object" && (<any>column.type).name && typeof (<any>column.type).name === "string") {
            realType = (<any>column.type).toLowerCase();
        }

        switch (realType) {
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
                return "time";
            case "datetime":
                return "timestamp";
            case "json":
                return "text";
            case "simple_array":
                return column.length ? "character varying(" + column.length + ")" : "text";
        }

        throw new Error("Specified type (" + column.type + ") is not supported by current driver.");
    }
    
}