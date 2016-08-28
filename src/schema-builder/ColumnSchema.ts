import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {QueryRunner} from "../driver/QueryRunner";

export class ColumnSchema {

    name: string;
    type: string;
    default: string;
    isNullable: boolean;
    isGenerated: boolean;
    isPrimary: boolean;
    comment: string|undefined;

    static create(queryRunner: QueryRunner, columnMetadata: ColumnMetadata) {
        const columnSchema = new ColumnSchema();
        columnSchema.name = columnMetadata.name;
        // columnSchema.default = columnMetadata.default;
        columnSchema.comment = columnMetadata.comment;
        columnSchema.isGenerated = columnMetadata.isGenerated;
        columnSchema.isNullable = columnMetadata.isNullable;
        columnSchema.type = queryRunner.normalizeType(columnMetadata);
        columnSchema.isPrimary = columnMetadata.isPrimary;
        return columnSchema;
    }

}