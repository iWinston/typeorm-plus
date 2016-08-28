import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {TableSchema} from "../schema-creator/TableSchema";
import {ColumnSchema} from "../schema-creator/ColumnSchema";

export interface DatabaseColumnProperties {
    name: string;
    type: string;
    nullable: boolean;
    generated: boolean;
    hasPrimaryKey: boolean;
    comment: string|undefined;
}

/**
 * todo: make internal too (need to refactor driver).
 */
export abstract class SchemaBuilder {

    abstract loadSchemaTables(tableNames: string[]): Promise<TableSchema[]>;
    abstract createTable(table: TableMetadata, columns: ColumnMetadata[]): Promise<void>;
    abstract createColumn(tableName: string, column: ColumnMetadata): Promise<void>;
    abstract changeColumn(tableName: string, oldColumn: ColumnSchema, newColumn: ColumnMetadata): Promise<void>;
    abstract dropColumn(tableName: string, columnName: string): Promise<void>;
    abstract createForeignKey(foreignKey: ForeignKeyMetadata): Promise<void>;
    abstract dropForeignKey(tableName: string, foreignKeyName: string): Promise<void>;
    abstract createIndex(tableName: string, index: IndexMetadata): Promise<void>;
    abstract dropIndex(tableName: string, indexName: string): Promise<void>;
    abstract createUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void>;
    abstract normalizeType(column: ColumnMetadata): any;

    /**
     * @deprecated
     */
    abstract changeColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void>;
    abstract getTableUniqueKeysQuery(tableName: string): Promise<string[]>;
    abstract getTableIndicesQuery(tableName: string): Promise<{ key: string, sequence: number, column: string }[]>;
    abstract getPrimaryConstraintName(tableName: string): Promise<string>;
    abstract renameColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumnName: ColumnMetadata): Promise<void>;
    abstract getTableForeignQuery(tableName: string): Promise<string[]>;
    abstract getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<DatabaseColumnProperties[]>;
    abstract checkIfTableExist(tableName: string): Promise<boolean>;
    abstract getTableColumns(tableName: string): Promise<DatabaseColumnProperties[]>;

}