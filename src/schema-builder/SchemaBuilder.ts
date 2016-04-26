import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";

/**
 * todo: make internal too (need to refactor driver).
 */
export abstract class SchemaBuilder {

    abstract getChangedColumns(tableName: string, columns: ColumnMetadata[]): Promise<{columnName: string, hasPrimaryKey: boolean}[]>;
    abstract checkIfTableExist(tableName: string): Promise<boolean>;
    abstract addColumnQuery(tableName: string, column: ColumnMetadata): Promise<void>;
    abstract dropColumnQuery(tableName: string, columnName: string): Promise<void>;
    abstract addForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void>;
    abstract dropForeignKeyQuery(foreignKey: ForeignKeyMetadata): Promise<void>;
    abstract dropForeignKeyQuery(tableName: string, foreignKeyName: string): Promise<void>;
    abstract getTableForeignQuery(table: TableMetadata): Promise<string[]>;
    abstract getTableUniqueKeysQuery(tableName: string): Promise<string[]>;
    abstract getPrimaryConstraintName(tableName: string): Promise<string>;
    abstract dropIndex(tableName: string, indexName: string): Promise<void>;
    abstract addUniqueKey(tableName: string, columnName: string, keyName: string): Promise<void>;
    abstract getTableColumns(tableName: string): Promise<string[]>;
    abstract changeColumnQuery(tableName: string, columnName: string, newColumn: ColumnMetadata, skipPrimary?: boolean): Promise<void>;
    abstract createTableQuery(table: TableMetadata, columns: ColumnMetadata[]): Promise<void>;

}