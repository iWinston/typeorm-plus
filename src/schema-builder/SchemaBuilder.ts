import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {TableSchema} from "../schema-creator/TableSchema";
import {ColumnSchema} from "../schema-creator/ColumnSchema";

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

}