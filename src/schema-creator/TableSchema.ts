import {ColumnSchema} from "./ColumnSchema";
import {IndexSchema} from "./IndexSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {UniqueKeySchema} from "./UniqueKeySchema";
import {PrimaryKeySchema} from "./PrimaryKeySchema";
import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";

export class TableSchema {

    name: string;
    columns: ColumnSchema[] = [];
    indices: IndexSchema[] = [];
    foreignKeys: ForeignKeySchema[] = [];
    uniqueKeys: UniqueKeySchema[] = [];
    primaryKey: PrimaryKeySchema|undefined;

    constructor(name: string) {
        this.name = name;
    }

    removeColumn(column: ColumnSchema) {
        const index = this.columns.indexOf(column);
        if (index !== -1)
            this.columns.splice(index, 1);
    }

    removeIndex(indexSchema: IndexSchema) {
        const index = this.indices.indexOf(indexSchema);
        if (index !== -1)
            this.indices.splice(index, 1);
    }

    removeForeignKey(foreignKey: ForeignKeySchema) {
        const index = this.foreignKeys.indexOf(foreignKey);
        if (index !== -1)
            this.foreignKeys.splice(index, 1);
    }

    removeUniqueByName(name: string) {
        const uniqueKey = this.uniqueKeys.find(uniqueKey => uniqueKey.name === name);
        if (!uniqueKey)
            return;

        const index = this.uniqueKeys.indexOf(uniqueKey);
        if (index === -1)
            return;

        this.uniqueKeys.splice(index, 1);
    }

    removePrimaryKey() {
        this.primaryKey = undefined;
    }

    static createFromMetadata(schemaBuilder: SchemaBuilder,
                              tableMetadata: TableMetadata,
                              columnMetadatas: ColumnMetadata[]): TableSchema {
        const tableSchema = new TableSchema(tableMetadata.name);
        tableSchema.columns = columnMetadatas.map(columnMetadata => ColumnSchema.create(schemaBuilder, columnMetadata));
        return tableSchema;
    }

    findChangedColumns(schemaBuilder: SchemaBuilder, columnMetadatas: ColumnMetadata[]) {
        return this.columns.filter(columnSchema => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.name === columnSchema.name);
            if (!columnMetadata) return false; // we don't need new columns, we only need exist and changed
            return  columnSchema.name !== columnMetadata.name ||
                    columnSchema.type !== schemaBuilder.normalizeType(columnMetadata) ||
                    columnSchema.comment !== columnMetadata.comment ||
                    columnSchema.default !== columnMetadata.default ||
                    columnSchema.isNullable !== columnMetadata.isNullable ||
                    // columnSchema.isPrimary !== columnMetadata.isPrimary ||
                    columnSchema.isGenerated !== columnMetadata.isGenerated;
        });
    }
}