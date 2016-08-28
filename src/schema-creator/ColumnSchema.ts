import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {ColumnMetadata} from "../metadata/ColumnMetadata";

export class ColumnSchema {

    name: string;
    type: string;
    default: string;
    isNullable: boolean;
    isGenerated: boolean;
    isPrimary: boolean;
    comment: string|undefined;

    static create(schemaBuilder: SchemaBuilder, columnMetadata: ColumnMetadata) {
        const columnSchema = new ColumnSchema();
        columnSchema.name = columnMetadata.name;
        // columnSchema.default = columnMetadata.default;
        columnSchema.comment = columnMetadata.comment;
        columnSchema.isGenerated = columnMetadata.isGenerated;
        columnSchema.isNullable = columnMetadata.isNullable;
        columnSchema.type = schemaBuilder.normalizeType(columnMetadata);
        columnSchema.isPrimary = columnMetadata.isPrimary;
        return columnSchema;
    }

}