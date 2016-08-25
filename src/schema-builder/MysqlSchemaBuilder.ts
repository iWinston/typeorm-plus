import {SchemaBuilder, DatabaseColumnProperties} from "./SchemaBuilder";
import {MysqlDriver} from "../driver/MysqlDriver";
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
export class MysqlSchemaBuilder extends SchemaBuilder {
    
    constructor(private driver: MysqlDriver,
                private dbConnection: DatabaseConnection) {
        super();
    }

    /*async getColumnProperties(tableName: string, columnName: string): Promise<{ isNullable: boolean, columnType: string, autoIncrement: boolean }|undefined> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.driver.db}'` +
            ` AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`;

        const result = await this.query<ObjectLiteral[]>(sql);
        if (!result || !result[0])
            return undefined;

        return {
            isNullable: result[0]["IS_NULLABLE"] === "YES",
     this.query       columnType: result[0]["COLUMN_TYPE"],
            autoIncrement: result[0]["EXTRA"].indexOf("auto_increment") !== -1
        };
    }*/

    /**
     * todo: reuse getColumns
     */
    getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<DatabaseColumnProperties[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.driver.db}'` +
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
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${this.driver.db}' AND TABLE_NAME = '${tableName}'`;
        return this.query(sql).then(results => !!(results && results.length));
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
        return this.query(sql).then((results: any[]) => results.map(result => result.CONSTRAINT_NAME));
    }

    getTableUniqueKeysQuery(tableName: string): Promise<string[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = "${this.driver.db}" ` +
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
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = "${this.driver.db}"`
            + ` AND TABLE_NAME = "${tableName}" AND CONSTRAINT_TYPE = 'PRIMARY KEY'`;
        return this.query(sql).then(results => results && results.length ? results[0].CONSTRAINT_NAME : undefined);
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

    getTableColumns(tableName: string): Promise<DatabaseColumnProperties[]> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.driver.db}' AND TABLE_NAME = '${tableName}'`;
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

    renameColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE ${tableName} CHANGE ${oldColumn.name} ${newColumn.name} ${oldColumn.type}`;
        return this.query(sql).then(() => {});
    }

    changeColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void> {
        const sql = `ALTER TABLE ${tableName} CHANGE ${oldColumn.name} ${this.buildCreateColumnSql(newColumn, oldColumn.hasPrimaryKey)}`; // todo: CHANGE OR MODIFY COLUMN ????
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
    
    private query(sql: string) {
        return this.driver.query(this.dbConnection, sql);
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
    
}