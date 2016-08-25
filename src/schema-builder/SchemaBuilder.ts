import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";

export interface DatabaseColumnProperties {
    name: string;
    type: string;
    nullable: boolean;
    hasPrimaryKey: boolean;
}

/**
 * todo: make internal too (need to refactor driver).
 */
export abstract class SchemaBuilder {

    // abstract getColumnProperties(tableName: string, columnName: string): Promise<{ isNullable: boolean, columnType: string, autoIncrement: boolean }|undefined>;
    abstract getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<DatabaseColumnProperties[]>;
    abstract checkIfTableExist(tableName: string): Promise<boolean>;
    abstract addColumnQuery(tableName: string, column: ColumnMetadata): Promise<void>;
    abstract dropColumnQuery(tableName: string, columnName: string): Promise<void>;
    abstract addForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void>;
    abstract dropForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void>;
    abstract dropForeignKeyQuery(tableName: string, foreignKeyName: string): Promise<void>;
    abstract getTableForeignQuery(tableName: string): Promise<string[]>;
    abstract getTableUniqueKeysQuery(tableName: string): Promise<string[]>;
    abstract getTableIndicesQuery(tableName: string): Promise<{ key: string, sequence: number, column: string }[]>;
    abstract getPrimaryConstraintName(tableName: string): Promise<string>;
    abstract dropIndex(tableName: string, indexName: string): Promise<void>;
    abstract createIndex(tableName: string, index: IndexMetadata): Promise<void>;
    abstract addUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void>;
    abstract getTableColumns(tableName: string): Promise<DatabaseColumnProperties[]>;
    abstract renameColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumnName: ColumnMetadata): Promise<void>;
    abstract changeColumnQuery(tableName: string, oldColumn: DatabaseColumnProperties, newColumn: ColumnMetadata): Promise<void>;
    abstract createTableQuery(table: TableMetadata, columns: ColumnMetadata[]): Promise<void>;

}