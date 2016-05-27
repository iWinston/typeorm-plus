import {SchemaBuilder} from "./SchemaBuilder";
import {MysqlDriver} from "../driver/MysqlDriver";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";

/**
 * @internal
 */
export class MysqlSchemaBuilder extends SchemaBuilder {
    
    constructor(private driver: MysqlDriver) {
        super();
    }
    
    getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<{columnName: string, hasPrimaryKey: boolean}[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.driver.db}'` +
            ` AND TABLE_NAME = '${tableName}'`;
        return this.query<any[]>(sql).then(results => {

            return columns.filter(column => {
                const dbData = results.find(result => result.COLUMN_NAME === column.name);
                if (!dbData) return false;

                const newType = this.normalizeType(column);
                const isNullable = column.isNullable === true ? "YES" : "NO";
                const hasDbColumnAutoIncrement = dbData.EXTRA.indexOf("auto_increment") !== -1;
                const hasDbColumnPrimaryIndex = dbData.COLUMN_KEY.indexOf("PRI") !== -1;
                return  dbData.COLUMN_TYPE !== newType ||
                    dbData.COLUMN_COMMENT !== column.comment ||
                    dbData.IS_NULLABLE !== isNullable ||
                    hasDbColumnAutoIncrement !== column.isGenerated ||
                    hasDbColumnPrimaryIndex !== column.isPrimary;
                
            }).map(column => {
                const dbData = results.find(result => result.COLUMN_NAME === column.name);
                const hasDbColumnPrimaryIndex = dbData.COLUMN_KEY.indexOf("PRI") !== -1;
                return { columnName: column.name, hasPrimaryKey: hasDbColumnPrimaryIndex };
            });
        });
    }

    checkIfTableExist(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${this.driver.db}' AND TABLE_NAME = '${tableName}'`;
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
        let sql = `ALTER TABLE ${foreignKey.tableName} ADD CONSTRAINT \`${foreignKey.name}\` ` +
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
        const sql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = "${this.driver.db}" `
            + `AND TABLE_NAME = "${tableName}" AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        return this.query<any[]>(sql).then(results => results.map(result => result.CONSTRAINT_NAME));
    }

    getTableUniqueKeysQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = "${this.driver.db}" ` +
            `AND TABLE_NAME = "${tableName}" AND CONSTRAINT_TYPE = 'UNIQUE'`;
        return this.query<any[]>(sql).then(results => results.map(result => result.CONSTRAINT_NAME));
    }

    getTableIndicesQuery(tableName: string): Promise<{ key: string, sequence: number, column: string }[]> {
        const sql = `SHOW INDEX FROM ${tableName}`;
        return this.query<any[]>(sql).then(results => {
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
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = "${this.driver.db}"`
            + ` AND TABLE_NAME = "${tableName}" AND CONSTRAINT_TYPE = 'PRIMARY KEY'`;
        return this.query<any[]>(sql).then(results => results && results.length ? results[0].CONSTRAINT_NAME : undefined);
    }

    dropIndex(tableName: string, indexName: string): Promise<void> {
        const sql = `ALTER TABLE ${tableName} DROP INDEX \`${indexName}\``;
        return this.query(sql).then(() => {});
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
        const sql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.driver.db}'` +
            ` AND TABLE_NAME = '${tableName}'`;
        return this.query<any[]>(sql).then(results => results.map(result => result.COLUMN_NAME));
    }

    changeColumnQuery(tableName: string, columnName: string, newColumn: ColumnMetadata, skipPrimary: boolean = false): Promise<void> {
        const sql = `ALTER TABLE ${tableName} CHANGE ${columnName} ${this.buildCreateColumnSql(newColumn, skipPrimary)}`;
        return this.query(sql).then(() => {});
    }

    createTableQuery(table: TableMetadata, columns: ColumnMetadata[]): Promise<void> {
        const columnDefinitions = columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        const sql = `CREATE TABLE \`${table.name}\` (${columnDefinitions}) ENGINE=InnoDB;`;
        return this.query(sql).then(() => {});
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    
    private query<T>(sql: string) {
        return this.driver.query<T>(sql);
    }

    private buildCreateColumnSql(column: ColumnMetadata, skipPrimary: boolean) {
        let c = column.name + " " + this.normalizeType(column);
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
                return "varchar(" + (column.length ? column.length : 255) + ")";
            case "text":
                return "text";
            case "boolean":
                return "boolean";
            case "integer":
            case "int":
                return "INT(" + (column.length ? column.length : 11) + ")";
            case "smallint":
                return "SMALLINT(" + (column.length ? column.length : 11) + ")";
            case "bigint":
                return "BIGINT(" + (column.length ? column.length : 11) + ")";
            case "float":
                return "FLOAT";
            case "double":
            case "number":
                return "DOUBLE";
            case "decimal":
                if (column.precision && column.scale) {
                    return `DECIMAL(${column.precision},${column.scale})`;
                    
                } else if (column.scale) {
                    return `DECIMAL(${column.scale})`;
                    
                } else if (column.precision) {
                    return `DECIMAL(${column.precision})`;
                    
                } else {
                    return "DECIMAL";
                    
                }
            case "date":
                return "DATE";
            case "time":
                return "TIME";
            case "datetime":
                return "DATETIME";
            case "json":
                return "text";
            case "simple_array":
                return column.length ? "varchar(" + column.length + ")" : "text";
        }

        throw new Error("Specified type (" + column.type + ") is not supported by current driver.");
    }
    
}